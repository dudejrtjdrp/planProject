-- =============================================================================
-- PlanProject · Canonical Database Schema
-- =============================================================================
-- This file is the single source of truth for the Supabase/PostgreSQL schema.
-- When the schema changes during development, this file is updated and the
-- incremental ALTER/CREATE commands are shared separately.
--
-- Tables
--   public.profiles          – internal team member identities (seeded)
--   public.projects          – strategic planning workspaces
--   public.project_versions  – project-level version snapshots
--   public.project_frameworks– per-project framework module attachments (versioned)
--   public.swot_items        – items inside a SWOT analysis
--   public.pestel_items      – items inside a PESTEL analysis
--   public.framework_meeting_notes – framework-specific meeting minutes
--   public.posts             – real-time team feed
--
-- Views
--   public.v_swot_items_with_context
--
-- Version history
--   v2: project_frameworks gains `version` column; unique constraint changed to
--       (project_id, framework_key, version) so multiple analyses of the same
--       framework type can exist per project.
--   v3: pestel_items table added.
--   v4: project_versions table added.
--   v5: pestel_items attachment columns + framework_meeting_notes table added.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger function – keeps updated_at current on every row update
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
--    Fixed set of internal users. Seeded below.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  avatar_color text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_name_unique unique (name)
);

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Seed – upsert so this is safe to re-run
insert into public.profiles (name, avatar_color)
values
  ('성효',   '#3B82F6'),
  ('죤슨빌', '#8B5CF6'),
  ('믹자',   '#10B981'),
  ('지건',   '#F59E0B'),
  ('Guest',  '#64748B')
on conflict (name) do update
  set avatar_color = excluded.avatar_color,
      updated_at   = now();

-- ---------------------------------------------------------------------------
-- 2. projects
--    Top-level strategic planning workspaces.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2.1 project_versions
--    Immutable snapshots of project title/description for version management.
-- ---------------------------------------------------------------------------
create table if not exists public.project_versions (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects(id) on delete cascade,
  version     int         not null,
  name        text        not null,
  description text,
  swot_version int,
  pestel_version int,
  created_at  timestamptz not null default now(),

  constraint project_versions_project_version_unique
    unique (project_id, version)
);

create index if not exists idx_project_versions_project_id
  on public.project_versions(project_id);

-- ---------------------------------------------------------------------------
-- 3. project_frameworks
--    Attaches a framework module to a project.
--    `version` allows multiple analyses of the same framework type per project
--    (e.g. SWOT v1, SWOT v2). Version auto-increments from the application.
-- ---------------------------------------------------------------------------
create table if not exists public.project_frameworks (
  id            uuid        primary key default gen_random_uuid(),
  project_id    uuid        not null references public.projects(id) on delete cascade,
  framework_key text        not null,
  version       int         not null default 1,
  title         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint project_frameworks_framework_key_check
    check (framework_key in ('swot', 'pestel', 'mckinsey_7s', 'matrix_2x2', 'persona_model', 'competitor_mapping')),

  -- Allows SWOT v1, SWOT v2, etc. per project
  constraint project_frameworks_project_framework_version_unique
    unique (project_id, framework_key, version)
);

create index if not exists idx_project_frameworks_project_id
  on public.project_frameworks(project_id);

create index if not exists idx_project_frameworks_framework_key
  on public.project_frameworks(framework_key);

create trigger trg_project_frameworks_set_updated_at
before update on public.project_frameworks
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. swot_items
--    Items inside a SWOT analysis, owned by a project_frameworks row.
--    created_by references profiles (nullable – items can be anonymous).
-- ---------------------------------------------------------------------------
create table if not exists public.swot_items (
  id                   uuid        primary key default gen_random_uuid(),
  project_framework_id uuid        not null references public.project_frameworks(id) on delete cascade,
  created_by           uuid        references public.profiles(id) on delete set null,
  quadrant             text        not null,
  content              text        not null,
  position             int         not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint swot_items_quadrant_check
    check (quadrant in ('strength', 'weakness', 'opportunity', 'threat'))
);

create index if not exists idx_swot_items_framework_id
  on public.swot_items(project_framework_id);

create index if not exists idx_swot_items_framework_quadrant
  on public.swot_items(project_framework_id, quadrant, position);

create index if not exists idx_swot_items_created_by
  on public.swot_items(created_by);

create trigger trg_swot_items_set_updated_at
before update on public.swot_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. pestel_items
--    Items inside a PESTEL analysis, owned by a project_frameworks row.
--    created_by references profiles (nullable).
-- ---------------------------------------------------------------------------
create table if not exists public.pestel_items (
  id                   uuid        primary key default gen_random_uuid(),
  project_framework_id uuid        not null references public.project_frameworks(id) on delete cascade,
  created_by           uuid        references public.profiles(id) on delete set null,
  factor               text        not null,
  content              text        not null,
  attachment_url       text,
  attachment_name      text,
  attachment_mime_type text,
  position             int         not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint pestel_items_factor_check
    check (factor in ('political', 'economic', 'social', 'technological', 'environmental', 'legal'))
);

create index if not exists idx_pestel_items_framework_id
  on public.pestel_items(project_framework_id);

create index if not exists idx_pestel_items_framework_factor
  on public.pestel_items(project_framework_id, factor, position);

create index if not exists idx_pestel_items_created_by
  on public.pestel_items(created_by);

create trigger trg_pestel_items_set_updated_at
before update on public.pestel_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. framework_meeting_notes
--    Project-level meeting minutes linked to each framework type.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. posts
--    Real-time team feed. Supabase Realtime enabled.
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid        primary key default gen_random_uuid(),
  content    text        not null,
  author     text        not null,
  created_at timestamptz not null default now()
);

-- Required for Supabase Realtime to broadcast deletes
alter table public.posts replica identity full;

-- Add table to realtime publication (idempotent guard)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
create or replace view public.v_swot_items_with_context as
select
  s.id,
  s.project_framework_id,
  pf.project_id,
  pf.framework_key,
  s.quadrant,
  s.content,
  s.position,
  s.created_by,
  s.created_at,
  s.updated_at
from public.swot_items s
join public.project_frameworks pf on pf.id = s.project_framework_id;
