-- Adds project-level immutable snapshots for version management
-- Safe to run multiple times

create extension if not exists pgcrypto;

create table if not exists public.project_versions (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects(id) on delete cascade,
  version     int         not null,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now(),

  constraint project_versions_project_version_unique
    unique (project_id, version)
);

create index if not exists idx_project_versions_project_id
  on public.project_versions(project_id);
