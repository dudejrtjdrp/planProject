import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fromFrameworkDbKey,
  toFrameworkDbKey,
  type FrameworkDbKey,
  type FrameworkKey,
  type ProjectFramework,
} from "@/features/frameworks/types/framework";

type ProjectFrameworkRow = {
  id: string;
  project_id: string;
  framework_key: FrameworkDbKey;
  version: number;
  title: string | null;
  created_at: string;
  updated_at: string;
};

function mapProjectFrameworkRow(row: ProjectFrameworkRow): ProjectFramework {
  return {
    id: row.id,
    projectId: row.project_id,
    frameworkKey: fromFrameworkDbKey(row.framework_key),
    version: row.version,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function attachFrameworkToProject(
  projectId: string,
  frameworkKey: FrameworkKey,
): Promise<ProjectFramework> {
  const supabase = createSupabaseServerClient();
  const frameworkDbKey = toFrameworkDbKey(frameworkKey);

  // Auto-increment version: find current max version for this project+framework
  const { data: versionData } = await supabase
    .from("project_frameworks")
    .select("version")
    .eq("project_id", projectId)
    .eq("framework_key", frameworkDbKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (versionData?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("project_frameworks")
    .insert({
      project_id: projectId,
      framework_key: frameworkDbKey,
      version: nextVersion,
    })
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to attach framework: ${error.message}`);
  }

  return mapProjectFrameworkRow(data as ProjectFrameworkRow);
}

/** Returns the latest version of a framework attached to a project. */
export async function getFrameworkByKey(
  projectId: string,
  frameworkKey: FrameworkKey,
): Promise<ProjectFramework | null> {
  const supabase = createSupabaseServerClient();
  const frameworkDbKey = toFrameworkDbKey(frameworkKey);

  const { data, error } = await supabase
    .from("project_frameworks")
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("framework_key", frameworkDbKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load framework: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectFrameworkRow(data as ProjectFrameworkRow);
}

/** Returns all versions of a framework attached to a project, newest first. */
export async function getFrameworkVersionsByKey(
  projectId: string,
  frameworkKey: FrameworkKey,
): Promise<ProjectFramework[]> {
  const supabase = createSupabaseServerClient();
  const frameworkDbKey = toFrameworkDbKey(frameworkKey);

  const { data, error } = await supabase
    .from("project_frameworks")
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("framework_key", frameworkDbKey)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(`Failed to load framework versions: ${error.message}`);
  }

  return ((data ?? []) as ProjectFrameworkRow[]).map(mapProjectFrameworkRow);
}

export async function getFrameworkByVersion(
  projectId: string,
  frameworkKey: FrameworkKey,
  version: number,
): Promise<ProjectFramework | null> {
  const supabase = createSupabaseServerClient();
  const frameworkDbKey = toFrameworkDbKey(frameworkKey);

  const { data, error } = await supabase
    .from("project_frameworks")
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("framework_key", frameworkDbKey)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load framework version: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectFrameworkRow(data as ProjectFrameworkRow);
}

export async function getFrameworkById(frameworkId: string): Promise<ProjectFramework | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("project_frameworks")
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .eq("id", frameworkId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load framework by id: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectFrameworkRow(data as ProjectFrameworkRow);
}

export async function updateFrameworkTitle(frameworkId: string, title: string | null): Promise<ProjectFramework> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("project_frameworks")
    .update({ title })
    .eq("id", frameworkId)
    .select("id, project_id, framework_key, version, title, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update framework content: ${error.message}`);
  }

  return mapProjectFrameworkRow(data as ProjectFrameworkRow);
}
