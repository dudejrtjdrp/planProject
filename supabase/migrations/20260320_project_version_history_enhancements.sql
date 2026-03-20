alter table public.project_versions
  add column if not exists editor_name text,
  add column if not exists commit_message text,
  add column if not exists snapshot_json jsonb,
  add column if not exists is_draft boolean not null default false,
  add column if not exists restored_from_version int,
  add column if not exists published_at timestamptz;

create index if not exists idx_project_versions_project_created_at
  on public.project_versions(project_id, created_at desc);

create index if not exists idx_project_versions_snapshot_gin
  on public.project_versions using gin (snapshot_json);
