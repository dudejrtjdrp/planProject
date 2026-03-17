-- Minimal + scalable strategy schema for Supabase/Postgres
-- Covers:
-- 1) projects
-- 2) project_frameworks (generic attachment)
-- 3) swot_items (first framework module)

create extension if not exists pgcrypto;

-- Shared trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Core project entity
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- 2) Generic framework attachment per project
-- One row = one framework module attached to a project.
-- Supports future frameworks with no schema change in projects.
create table if not exists public.project_frameworks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  framework_key text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint project_frameworks_framework_key_check
    check (framework_key in ('swot', 'pestel', 'mckinsey_7s', 'matrix_2x2', 'competitor_mapping')),

  -- Prevent duplicate attachment of same framework to same project in MVP.
  constraint project_frameworks_project_framework_unique unique (project_id, framework_key)
);

create index if not exists idx_project_frameworks_project_id
  on public.project_frameworks(project_id);

create index if not exists idx_project_frameworks_framework_key
  on public.project_frameworks(framework_key);

create trigger trg_project_frameworks_set_updated_at
before update on public.project_frameworks
for each row
execute function public.set_updated_at();

-- 3) SWOT framework item table (first framework example)
-- Uses project_framework_id to keep framework module ownership normalized.
create table if not exists public.swot_items (
  id uuid primary key default gen_random_uuid(),
  project_framework_id uuid not null references public.project_frameworks(id) on delete cascade,
  quadrant text not null,
  content text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint swot_items_quadrant_check
    check (quadrant in ('strength', 'weakness', 'opportunity', 'threat'))
);

create index if not exists idx_swot_items_framework_id
  on public.swot_items(project_framework_id);

create index if not exists idx_swot_items_framework_quadrant
  on public.swot_items(project_framework_id, quadrant, position);

create trigger trg_swot_items_set_updated_at
before update on public.swot_items
for each row
execute function public.set_updated_at();

-- Helpful view for reading SWOT rows with project context.
create or replace view public.v_swot_items_with_context as
select
  s.id,
  s.project_framework_id,
  pf.project_id,
  pf.framework_key,
  s.quadrant,
  s.content,
  s.position,
  s.created_at,
  s.updated_at
from public.swot_items s
join public.project_frameworks pf on pf.id = s.project_framework_id;
