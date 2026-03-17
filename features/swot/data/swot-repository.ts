import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachFrameworkToProject, getFrameworkByKey } from "@/features/frameworks/data/framework-repository";
import type { SwotDbQuadrant, SwotItem, SwotType } from "@/features/swot/types/swot-item";
import { fromSwotDbQuadrant, toSwotDbQuadrant } from "@/features/swot/types/swot-item";

type SwotItemRow = {
  id: string;
  project_framework_id: string;
  created_by: string | null;
  quadrant: SwotDbQuadrant;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapSwotItemRow(row: SwotItemRow): SwotItem {
  return {
    id: row.id,
    projectFrameworkId: row.project_framework_id,
    createdBy: row.created_by,
    type: fromSwotDbQuadrant(row.quadrant),
    content: row.content,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrAttachSwotFramework(projectId: string): Promise<{ id: string }> {
  const existingFramework = await getFrameworkByKey(projectId, "SWOT");
  if (existingFramework) {
    return { id: existingFramework.id };
  }

  const attachedFramework = await attachFrameworkToProject(projectId, "SWOT");
  return { id: attachedFramework.id };
}

export async function getSwotItems(projectId: string): Promise<SwotItem[]> {
  const framework = await getFrameworkByKey(projectId, "SWOT");
  if (!framework) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("swot_items")
    .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
    .eq("project_framework_id", framework.id)
    .order("quadrant", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load SWOT items: ${error.message}`);
  }

  const rows = (data ?? []) as SwotItemRow[];
  return rows.map(mapSwotItemRow);
}

export async function getSwotItemsByFrameworkId(projectFrameworkId: string): Promise<SwotItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("swot_items")
    .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
    .eq("project_framework_id", projectFrameworkId)
    .order("quadrant", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load SWOT items: ${error.message}`);
  }

  const rows = (data ?? []) as SwotItemRow[];
  return rows.map(mapSwotItemRow);
}

export async function createSwotItem(
  projectId: string,
  type: SwotType,
  content: string,
  createdBy: string,
  projectFrameworkId?: string,
): Promise<SwotItem> {
  const supabase = createSupabaseServerClient();
  const framework = projectFrameworkId ? { id: projectFrameworkId } : await getOrAttachSwotFramework(projectId);
  const quadrant = toSwotDbQuadrant(type);

  const { data: positionData, error: positionError } = await supabase
    .from("swot_items")
    .select("position")
    .eq("project_framework_id", framework.id)
    .eq("quadrant", quadrant)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    throw new Error(`Failed to prepare SWOT item position: ${positionError.message}`);
  }

  const nextPosition = (positionData?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("swot_items")
    .insert({
      project_framework_id: framework.id,
      created_by: createdBy,
      quadrant,
      content,
      position: nextPosition,
    })
    .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create SWOT item: ${error.message}`);
  }

  return mapSwotItemRow(data as SwotItemRow);
}

export async function deleteSwotItem(itemId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("swot_items").delete().eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete SWOT item: ${error.message}`);
  }
}

export async function updateSwotItemType(itemId: string, newType: SwotType): Promise<SwotItem> {
  const supabase = createSupabaseServerClient();
  const quadrant = toSwotDbQuadrant(newType);

  const { data, error } = await supabase
    .from("swot_items")
    .update({ quadrant })
    .eq("id", itemId)
    .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update SWOT item type: ${error.message}`);
  }

  return mapSwotItemRow(data as SwotItemRow);
}

export async function updateSwotItemContent(itemId: string, content: string): Promise<SwotItem> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("swot_items")
    .update({ content })
    .eq("id", itemId)
    .select("id, project_framework_id, created_by, quadrant, content, position, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update SWOT item content: ${error.message}`);
  }

  return mapSwotItemRow(data as SwotItemRow);
}

export async function updateSwotItemsOrder(
  updates: Array<{ id: string; type: SwotType; position: number }>,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const operations = updates.map((update) =>
    supabase
      .from("swot_items")
      .update({ quadrant: toSwotDbQuadrant(update.type), position: update.position })
      .eq("id", update.id),
  );

  const results = await Promise.all(operations);

  for (const result of results) {
    if (result.error) {
      throw new Error(`Failed to update SWOT item order: ${result.error.message}`);
    }
  }
}

export async function cloneSwotItemsToFramework(
  sourceFrameworkId: string,
  targetFrameworkId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("swot_items")
    .select("created_by, quadrant, content, position")
    .eq("project_framework_id", sourceFrameworkId)
    .order("quadrant", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load source SWOT items: ${error.message}`);
  }

  const sourceItems = data ?? [];
  if (sourceItems.length === 0) {
    return;
  }

  const payload = sourceItems.map((item) => ({
    project_framework_id: targetFrameworkId,
    created_by: item.created_by,
    quadrant: item.quadrant,
    content: item.content,
    position: item.position,
  }));

  const { error: insertError } = await supabase.from("swot_items").insert(payload);
  if (insertError) {
    throw new Error(`Failed to clone SWOT items: ${insertError.message}`);
  }
}
