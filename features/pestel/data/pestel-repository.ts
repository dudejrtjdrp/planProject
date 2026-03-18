import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attachFrameworkToProject, getFrameworkByKey } from "@/features/frameworks/data/framework-repository";
import type { PestelDbFactor, PestelItem } from "@/features/pestel/types/pestel-item";
import { fromPestelDbFactor, parsePestelContent, toPestelDbFactor, type PestelFactor } from "@/features/pestel/types/pestel-item";

type PestelItemRow = {
  id: string;
  project_framework_id: string;
  created_by: string | null;
  factor: PestelDbFactor;
  title: string | null;
  description: string | null;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

function mapPestelItemRow(row: PestelItemRow): PestelItem {
  const parsed = parsePestelContent(row.content);
  return {
    id: row.id,
    projectFrameworkId: row.project_framework_id,
    createdBy: row.created_by,
    factor: fromPestelDbFactor(row.factor),
    title: row.title?.trim() || parsed.title,
    description: row.description?.trim() || parsed.description,
    content: row.content,
    attachmentUrl: row.attachment_url,
    attachmentName: row.attachment_name,
    attachmentMimeType: row.attachment_mime_type,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrAttachPestelFramework(projectId: string): Promise<{ id: string }> {
  const existing = await getFrameworkByKey(projectId, "PESTEL");
  if (existing) {
    return { id: existing.id };
  }

  const attached = await attachFrameworkToProject(projectId, "PESTEL");
  return { id: attached.id };
}

export async function getPestelItems(projectId: string): Promise<PestelItem[]> {
  const framework = await getFrameworkByKey(projectId, "PESTEL");
  if (!framework) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pestel_items")
    .select(
      "id, project_framework_id, created_by, factor, title, description, content, attachment_url, attachment_name, attachment_mime_type, position, created_at, updated_at",
    )
    .eq("project_framework_id", framework.id)
    .order("factor", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load PESTEL items: ${error.message}`);
  }

  return ((data ?? []) as PestelItemRow[]).map(mapPestelItemRow);
}

export async function getPestelItemsByFrameworkId(projectFrameworkId: string): Promise<PestelItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pestel_items")
    .select(
      "id, project_framework_id, created_by, factor, title, description, content, attachment_url, attachment_name, attachment_mime_type, position, created_at, updated_at",
    )
    .eq("project_framework_id", projectFrameworkId)
    .order("factor", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load PESTEL items: ${error.message}`);
  }

  return ((data ?? []) as PestelItemRow[]).map(mapPestelItemRow);
}

export async function createPestelItem(
  projectId: string,
  factor: PestelFactor,
  content: string,
  createdBy: string,
  attachment?: {
    url: string;
    name: string;
    mimeType: string;
  },
  projectFrameworkId?: string,
): Promise<PestelItem> {
  const supabase = createSupabaseServerClient();
  const framework = projectFrameworkId ? { id: projectFrameworkId } : await getOrAttachPestelFramework(projectId);
  const dbFactor = toPestelDbFactor(factor);

  const { data: positionData, error: positionError } = await supabase
    .from("pestel_items")
    .select("position")
    .eq("project_framework_id", framework.id)
    .eq("factor", dbFactor)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    throw new Error(`Failed to prepare PESTEL item position: ${positionError.message}`);
  }

  const nextPosition = (positionData?.position ?? -1) + 1;
  const parsed = parsePestelContent(content);

  const { data, error } = await supabase
    .from("pestel_items")
    .insert({
      project_framework_id: framework.id,
      created_by: createdBy,
      factor: dbFactor,
      title: parsed.title,
      description: parsed.description,
      content,
      attachment_url: attachment?.url ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_mime_type: attachment?.mimeType ?? null,
      position: nextPosition,
    })
    .select(
      "id, project_framework_id, created_by, factor, title, description, content, attachment_url, attachment_name, attachment_mime_type, position, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to create PESTEL item: ${error.message}`);
  }

  return mapPestelItemRow(data as PestelItemRow);
}

export async function deletePestelItem(itemId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("pestel_items").delete().eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete PESTEL item: ${error.message}`);
  }
}

export async function updatePestelItemContent(itemId: string, content: string): Promise<PestelItem> {
  const supabase = createSupabaseServerClient();
  const parsed = parsePestelContent(content);

  const { data, error } = await supabase
    .from("pestel_items")
    .update({ content, title: parsed.title, description: parsed.description })
    .eq("id", itemId)
    .select(
      "id, project_framework_id, created_by, factor, title, description, content, attachment_url, attachment_name, attachment_mime_type, position, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(`Failed to update PESTEL item content: ${error.message}`);
  }

  return mapPestelItemRow(data as PestelItemRow);
}

export async function updatePestelItemsOrder(
  updates: Array<{ id: string; factor: PestelFactor; position: number }>,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const operations = updates.map((update) =>
    supabase
      .from("pestel_items")
      .update({ factor: toPestelDbFactor(update.factor), position: update.position })
      .eq("id", update.id),
  );

  const results = await Promise.all(operations);

  for (const result of results) {
    if (result.error) {
      throw new Error(`Failed to update PESTEL item order: ${result.error.message}`);
    }
  }
}

export async function clonePestelItemsToFramework(
  sourceFrameworkId: string,
  targetFrameworkId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pestel_items")
    .select("created_by, factor, title, description, content, attachment_url, attachment_name, attachment_mime_type, position")
    .eq("project_framework_id", sourceFrameworkId)
    .order("factor", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load source PESTEL items: ${error.message}`);
  }

  const sourceItems = data ?? [];
  if (sourceItems.length === 0) {
    return;
  }

  const payload = sourceItems.map((item) => ({
    project_framework_id: targetFrameworkId,
    created_by: item.created_by,
    factor: item.factor,
    title: item.title,
    description: item.description,
    content: item.content,
    attachment_url: item.attachment_url,
    attachment_name: item.attachment_name,
    attachment_mime_type: item.attachment_mime_type,
    position: item.position,
  }));

  const { error: insertError } = await supabase.from("pestel_items").insert(payload);
  if (insertError) {
    throw new Error(`Failed to clone PESTEL items: ${insertError.message}`);
  }
}
