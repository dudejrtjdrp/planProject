import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateProjectInput, Project } from "@/features/projects/types/project";
import type { FrameworkDbKey } from "@/features/frameworks/types/framework";

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
  editorName: string | null;
  commitMessage: string | null;
  snapshot: Record<string, unknown> | null;
  isDraft: boolean;
  restoredFromVersion: number | null;
  publishedAt: string | null;
  createdAt: string;
};

type ProjectVersionRow = {
  id: string;
  project_id: string;
  version: number;
  name: string;
  description: string | null;
  editor_name: string | null;
  commit_message: string | null;
  snapshot_json: Record<string, unknown> | null;
  is_draft: boolean | null;
  restored_from_version: number | null;
  published_at: string | null;
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
    editorName: row.editor_name,
    commitMessage: row.commit_message,
    snapshot: row.snapshot_json,
    isDraft: Boolean(row.is_draft),
    restoredFromVersion: row.restored_from_version,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

type ProjectFrameworkRow = {
  id: string;
  project_id: string;
  framework_key: FrameworkDbKey;
  version: number;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type SwotItemSnapshotRow = {
  id: string;
  project_framework_id: string;
  created_by: string | null;
  quadrant: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type PestelItemSnapshotRow = {
  id: string;
  project_framework_id: string;
  created_by: string | null;
  factor: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

type FrameworkMeetingNoteSnapshotRow = {
  title: string;
  content: string;
  meeting_date: string;
  created_by: string | null;
  framework_key: FrameworkDbKey;
  created_at: string;
  updated_at: string;
};

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

function isProjectVersionsEnhancementColumnMissingError(error: { message?: string } | null | undefined): boolean {
  if (!error?.message) {
    return false;
  }

  return error.message.includes("column project_versions.") && error.message.includes("does not exist");
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
    .select("id, project_id, version, name, description, editor_name, commit_message, is_draft, restored_from_version, published_at, created_at")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      return [];
    }

    if (isProjectVersionsEnhancementColumnMissingError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("project_versions")
        .select("id, project_id, version, name, description, created_at")
        .eq("project_id", projectId)
        .order("version", { ascending: false });

      if (legacyError) {
        throw new Error(`Failed to load project versions: ${legacyError.message}`);
      }

      return ((legacyData ?? []) as ProjectVersionRow[]).map(mapProjectVersionRow);
    }

    throw new Error(`Failed to load project versions: ${error.message}`);
  }

  return ((data ?? []) as ProjectVersionRow[]).map(mapProjectVersionRow);
}

export async function assertProjectHasVersion(projectId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("project_versions")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      throw new Error("project_versions table is missing. Apply latest schema first.");
    }

    throw new Error(`Failed to validate project version: ${error.message}`);
  }

  if (!count || count < 1) {
    throw new Error("프로젝트 버전이 없습니다. 먼저 프로젝트 버전을 생성해 주세요.");
  }
}

export async function getProjectVersion(projectId: string, version: number): Promise<ProjectVersion | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_versions")
    .select("id, project_id, version, name, description, editor_name, commit_message, snapshot_json, is_draft, restored_from_version, published_at, created_at")
    .eq("project_id", projectId)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      return null;
    }

    if (isProjectVersionsEnhancementColumnMissingError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("project_versions")
        .select("id, project_id, version, name, description, created_at")
        .eq("project_id", projectId)
        .eq("version", version)
        .maybeSingle();

      if (legacyError) {
        throw new Error(`Failed to load project version: ${legacyError.message}`);
      }

      if (!legacyData) {
        return null;
      }

      return mapProjectVersionRow(legacyData as ProjectVersionRow);
    }

    throw new Error(`Failed to load project version: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectVersionRow(data as ProjectVersionRow);
}

async function buildProjectSnapshot(projectId: string): Promise<Record<string, unknown>> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  const supabase = createSupabaseServerClient();

  const { data: frameworkData, error: frameworkError } = await supabase
    .from("project_frameworks")
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .eq("project_id", projectId)
    .order("framework_key", { ascending: true })
    .order("version", { ascending: true });

  if (frameworkError) {
    throw new Error(`Failed to snapshot project frameworks: ${frameworkError.message}`);
  }

  const frameworks = (frameworkData ?? []) as ProjectFrameworkRow[];
  const frameworkIds = frameworks.map((item) => item.id);

  let swotRows: SwotItemSnapshotRow[] = [];
  let pestelRows: PestelItemSnapshotRow[] = [];

  if (frameworkIds.length > 0) {
    const [{ data: swotData, error: swotError }, { data: pestelData, error: pestelError }] = await Promise.all([
      supabase
        .from("swot_items")
        .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
        .in("project_framework_id", frameworkIds)
        .order("position", { ascending: true }),
      supabase
        .from("pestel_items")
        .select("id, project_framework_id, created_by, factor, content, attachment_url, attachment_name, attachment_mime_type, position, created_at, updated_at")
        .in("project_framework_id", frameworkIds)
        .order("position", { ascending: true }),
    ]);

    if (swotError) {
      throw new Error(`Failed to snapshot SWOT items: ${swotError.message}`);
    }

    if (pestelError) {
      throw new Error(`Failed to snapshot PESTEL items: ${pestelError.message}`);
    }

    swotRows = (swotData ?? []) as SwotItemSnapshotRow[];
    pestelRows = (pestelData ?? []) as PestelItemSnapshotRow[];
  }

  const { data: notesData, error: notesError } = await supabase
    .from("framework_meeting_notes")
    .select("title, content, meeting_date, created_by, framework_key, created_at, updated_at")
    .eq("project_id", projectId)
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (notesError) {
    throw new Error(`Failed to snapshot meeting notes: ${notesError.message}`);
  }

  const swotByFramework = new Map<string, SwotItemSnapshotRow[]>();
  for (const item of swotRows) {
    const list = swotByFramework.get(item.project_framework_id) ?? [];
    list.push(item);
    swotByFramework.set(item.project_framework_id, list);
  }

  const pestelByFramework = new Map<string, PestelItemSnapshotRow[]>();
  for (const item of pestelRows) {
    const list = pestelByFramework.get(item.project_framework_id) ?? [];
    list.push(item);
    pestelByFramework.set(item.project_framework_id, list);
  }

  const frameworkSnapshots = frameworks.map((framework) => ({
    frameworkKey: framework.framework_key,
    version: framework.version,
    title: framework.title,
    createdAt: framework.created_at,
    updatedAt: framework.updated_at,
    swotItems: swotByFramework.get(framework.id) ?? [],
    pestelItems: pestelByFramework.get(framework.id) ?? [],
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt,
    },
    frameworks: frameworkSnapshots,
    meetingNotes: ((notesData ?? []) as FrameworkMeetingNoteSnapshotRow[]).map((note) => ({
      title: note.title,
      content: note.content,
      meetingDate: note.meeting_date,
      createdBy: note.created_by,
      frameworkKey: note.framework_key,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })),
    capturedAt: new Date().toISOString(),
  };
}

export async function createProjectVersionSnapshot(
  projectId: string,
  options?: {
    editorName?: string | null;
    commitMessage?: string | null;
    isDraft?: boolean;
    restoredFromVersion?: number | null;
  },
): Promise<ProjectVersion> {
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
  const snapshotJson = await buildProjectSnapshot(projectId);
  const isDraft = Boolean(options?.isDraft);

  const { data, error } = await supabase
    .from("project_versions")
    .insert({
      project_id: projectId,
      version: nextVersion,
      name: project.name,
      description: project.description,
      editor_name: options?.editorName ?? null,
      commit_message: options?.commitMessage ?? null,
      snapshot_json: snapshotJson,
      is_draft: isDraft,
      restored_from_version: options?.restoredFromVersion ?? null,
      published_at: isDraft ? null : new Date().toISOString(),
    })
    .select("id, project_id, version, name, description, editor_name, commit_message, snapshot_json, is_draft, restored_from_version, published_at, created_at")
    .single();

  if (error) {
    if (isProjectVersionsTableMissingError(error)) {
      throw new Error("project_versions table is missing. Apply latest schema first.");
    }

    if (isProjectVersionsEnhancementColumnMissingError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("project_versions")
        .insert({
          project_id: projectId,
          version: nextVersion,
          name: project.name,
          description: project.description,
        })
        .select("id, project_id, version, name, description, created_at")
        .single();

      if (legacyError) {
        throw new Error(`Failed to create project version snapshot: ${legacyError.message}`);
      }

      return mapProjectVersionRow(legacyData as ProjectVersionRow);
    }

    throw new Error(`Failed to create project version snapshot: ${error.message}`);
  }

  return mapProjectVersionRow(data as ProjectVersionRow);
}

export async function restoreProjectVersion(
  projectId: string,
  version: number,
  options?: {
    expectedUpdatedAt?: string | null;
    editorName?: string | null;
  },
): Promise<Project> {
  const currentProject = await getProjectById(projectId);
  if (!currentProject) {
    throw new Error("Project not found.");
  }

  if (options?.expectedUpdatedAt && currentProject.updatedAt !== options.expectedUpdatedAt) {
    throw new Error("CONFLICT: project has been updated by another user. Refresh and try restoring again.");
  }

  const snapshot = await getProjectVersion(projectId, version);
  if (!snapshot) {
    throw new Error("Project version not found.");
  }

  const restoredProject = await updateProject(projectId, {
    name: snapshot.name,
    description: snapshot.description,
  });

  const meetingNotes = Array.isArray(snapshot.snapshot?.meetingNotes) ? snapshot.snapshot.meetingNotes : [];
  const validFrameworkKeys: FrameworkDbKey[] = [
    "swot",
    "pestel",
    "mckinsey_7s",
    "matrix_2x2",
    "persona_model",
    "competitor_mapping",
  ];

  const supabase = createSupabaseServerClient();
  const { error: deleteNotesError } = await supabase
    .from("framework_meeting_notes")
    .delete()
    .eq("project_id", projectId);

  if (deleteNotesError) {
    throw new Error(`Failed to restore meeting notes: ${deleteNotesError.message}`);
  }

  const noteRows = meetingNotes
    .map((item) => (item && typeof item === "object" ? item as Record<string, unknown> : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const frameworkKey = String(item.frameworkKey ?? "swot") as FrameworkDbKey;
      if (!validFrameworkKeys.includes(frameworkKey)) {
        return null;
      }

      return {
        project_id: projectId,
        framework_key: frameworkKey,
        title: String(item.title ?? "회의록"),
        content: String(item.content ?? ""),
        meeting_date: String(item.meetingDate ?? new Date().toISOString().slice(0, 10)),
        created_by: typeof item.createdBy === "string" && item.createdBy.length > 0 ? item.createdBy : null,
      };
    })
    .filter((item): item is {
      project_id: string;
      framework_key: FrameworkDbKey;
      title: string;
      content: string;
      meeting_date: string;
      created_by: string | null;
    } => Boolean(item));

  if (noteRows.length > 0) {
    const { error: insertNotesError } = await supabase.from("framework_meeting_notes").insert(noteRows);
    if (insertNotesError) {
      throw new Error(`Failed to restore meeting notes: ${insertNotesError.message}`);
    }
  }

  await createProjectVersionSnapshot(projectId, {
    editorName: options?.editorName ?? null,
    commitMessage: `Restore from v${version}`,
    restoredFromVersion: version,
  });

  return restoredProject;
}
