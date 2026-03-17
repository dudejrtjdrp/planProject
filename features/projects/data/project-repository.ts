import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateProjectInput, Project } from "@/features/projects/types/project";

const PROJECTS_TABLE_PATH = "public.projects";
const PROJECTS_TABLE_MISSING_MESSAGE = `Could not find the table '${PROJECTS_TABLE_PATH}' in the schema cache`;
const PROJECT_VERSIONS_TABLE_PATH = "public.project_versions";
const PROJECT_VERSIONS_TABLE_MISSING_MESSAGE = `Could not find the table '${PROJECT_VERSIONS_TABLE_PATH}' in the schema cache`;

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectVersion = {
  id: string;
  projectId: string;
  version: number;
  name: string;
  description: string | null;
  createdAt: string;
};

type ProjectVersionRow = {
  id: string;
  project_id: string;
  version: number;
  name: string;
  description: string | null;
  created_at: string;
};

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    frameworks: [],
  };
}

function mapProjectVersionRow(row: ProjectVersionRow): ProjectVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

function isProjectsTableMissingError(error: { message?: string } | null | undefined): boolean {
  if (!error?.message) {
    return false;
  }

  return error.message.includes(PROJECTS_TABLE_MISSING_MESSAGE);
}

function isProjectVersionsTableMissingError(error: { message?: string } | null | undefined): boolean {
  if (!error?.message) {
    return false;
  }

  return error.message.includes(PROJECT_VERSIONS_TABLE_MISSING_MESSAGE);
}

function buildProjectsSchemaGuideMessage(action: string): string {
  return `Failed to ${action}: ${PROJECTS_TABLE_MISSING_MESSAGE}. Run Supabase migrations to create table '${PROJECTS_TABLE_PATH}'.`;
}

export function isMissingProjectsTableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes(PROJECTS_TABLE_MISSING_MESSAGE);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isProjectsTableMissingError(error)) {
      throw new Error(buildProjectsSchemaGuideMessage("load projects"));
    }

    throw new Error(`Failed to load projects: ${error.message}`);
  }

  return (data ?? []).map((row) => mapProjectRow(row as ProjectRow));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isProjectsTableMissingError(error)) {
      return null;
    }

    throw new Error(`Failed to load project: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectRow(data as ProjectRow);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createSupabaseServerClient();
  const payload = {
    name: input.name,
    description: input.description ?? null,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id, name, description, created_at, updated_at")
    .single();

  if (error) {
    if (isProjectsTableMissingError(error)) {
      throw new Error(buildProjectsSchemaGuideMessage("create project"));
    }

    throw new Error(`Failed to create project: ${error.message}`);
  }

  return mapProjectRow(data as ProjectRow);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    if (isProjectsTableMissingError(error)) {
      throw new Error(buildProjectsSchemaGuideMessage("delete project"));
    }

    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function updateProject(
  id: string,
  input: { name: string; description?: string | null },
): Promise<Project> {
  const supabase = createSupabaseServerClient();
  const payload = {
    name: input.name,
    description: input.description ?? null,
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("id, name, description, created_at, updated_at")
    .single();

  if (error) {
    if (isProjectsTableMissingError(error)) {
      throw new Error(buildProjectsSchemaGuideMessage("update project"));
    }

    throw new Error(`Failed to update project: ${error.message}`);
  }

  return mapProjectRow(data as ProjectRow);
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_versions")
    .select("id, project_id, version, name, description, created_at")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      return [];
    }
    throw new Error(`Failed to load project versions: ${error.message}`);
  }

  return ((data ?? []) as ProjectVersionRow[]).map(mapProjectVersionRow);
}

export async function getProjectVersion(projectId: string, version: number): Promise<ProjectVersion | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_versions")
    .select("id, project_id, version, name, description, created_at")
    .eq("project_id", projectId)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      return null;
    }
    throw new Error(`Failed to load project version: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectVersionRow(data as ProjectVersionRow);
}

export async function createProjectVersionSnapshot(projectId: string): Promise<ProjectVersion> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const supabase = createSupabaseServerClient();
  const { data: latest } = await supabase
    .from("project_versions")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  const [{ data: latestSwot }, { data: latestPestel }] = await Promise.all([
    supabase
      .from("project_frameworks")
      .select("version")
      .eq("project_id", projectId)
      .eq("framework_key", "swot")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("project_frameworks")
      .select("version")
      .eq("project_id", projectId)
      .eq("framework_key", "pestel")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data, error } = await supabase
    .from("project_versions")
    .insert({
      project_id: projectId,
      version: nextVersion,
      name: project.name,
      description: project.description,
      swot_version: latestSwot?.version ?? null,
      pestel_version: latestPestel?.version ?? null,
    })
    .select("id, project_id, version, name, description, swot_version, pestel_version, created_at")
    .single();

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      throw new Error("project_versions table is missing. Apply latest schema first.");
    }
    throw new Error(`Failed to create project version snapshot: ${error.message}`);
  }

  return mapProjectVersionRow(data as ProjectVersionRow);
}

export async function restoreProjectVersion(projectId: string, version: number): Promise<Project> {
  const snapshot = await getProjectVersion(projectId, version);
  if (!snapshot) {
    throw new Error("Project version not found.");
  }

  return updateProject(projectId, {
    name: snapshot.name,
    description: snapshot.description,
  });
}
