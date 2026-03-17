-- Add lightweight profile system and profile context for SWOT items

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_unique unique (name)
);

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.swot_items
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_swot_items_created_by on public.swot_items(created_by);

insert into public.profiles (name, avatar_color)
values
  ('성효', '#3B82F6'),
  ('죤슨빌', '#8B5CF6'),
  ('믹자', '#10B981'),
  ('지건', '#F59E0B'),
  ('Guest', '#64748B')
on conflict (name)
do update
set avatar_color = excluded.avatar_color,
    updated_at = now();
