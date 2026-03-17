-- Add persona_model to project_frameworks framework key check constraint

alter table public.project_frameworks
  drop constraint if exists project_frameworks_framework_key_check;

alter table public.project_frameworks
  add constraint project_frameworks_framework_key_check
  check (framework_key in ('swot', 'pestel', 'mckinsey_7s', 'matrix_2x2', 'persona_model', 'competitor_mapping'));
