create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author text not null,
  created_at timestamptz not null default now()
);

alter table public.posts replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
