-- Add attachment metadata columns to PESTEL items
alter table if exists public.pestel_items
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime_type text;

-- Create storage bucket for PESTEL attachments
insert into storage.buckets (id, name, public)
values ('pestel-attachments', 'pestel-attachments', true)
on conflict (id) do nothing;

-- Allow public uploads to PESTEL attachment bucket (app currently uses anon client)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Allow public upload for pestel attachments'
      and tablename = 'objects'
      and schemaname = 'storage'
  ) then
    create policy "Allow public upload for pestel attachments"
    on storage.objects
    for insert
    to public
    with check (bucket_id = 'pestel-attachments');
  end if;
end $$;

-- Allow public read access to PESTEL attachment bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Allow public read for pestel attachments'
      and tablename = 'objects'
      and schemaname = 'storage'
  ) then
    create policy "Allow public read for pestel attachments"
    on storage.objects
    for select
    to public
    using (bucket_id = 'pestel-attachments');
  end if;
end $$;

-- Framework meeting notes table
create table if not exists public.framework_meeting_notes (
  id            uuid        primary key default gen_random_uuid(),
  project_id    uuid        not null references public.projects(id) on delete cascade,
  framework_key text        not null,
  title         text        not null,
  content       text        not null,
  meeting_date  date        not null default current_date,
  created_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint framework_meeting_notes_framework_key_check
    check (framework_key in ('swot', 'pestel', 'mckinsey_7s', 'matrix_2x2', 'persona_model', 'competitor_mapping'))
);

create index if not exists idx_framework_meeting_notes_project_id
  on public.framework_meeting_notes(project_id);

create index if not exists idx_framework_meeting_notes_project_framework_date
  on public.framework_meeting_notes(project_id, framework_key, meeting_date desc, created_at desc);

create trigger trg_framework_meeting_notes_set_updated_at
before update on public.framework_meeting_notes
for each row execute function public.set_updated_at();
