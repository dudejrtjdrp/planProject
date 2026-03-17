-- Store framework version references in project snapshots
-- Safe to run multiple times

alter table public.project_versions
  add column if not exists swot_version int,
  add column if not exists pestel_version int;
