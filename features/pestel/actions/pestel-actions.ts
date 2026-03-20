"use server";

import { revalidatePath } from "next/cache";
import { getProfileByName } from "@/features/profiles/data/profile-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createPestelItem,
  deletePestelItem,
  updatePestelItemContent,
  updatePestelItemsOrder,
} from "@/features/pestel/data/pestel-repository";
import { assertProjectHasVersion } from "@/features/projects/data/project-repository";
import { pestelFactors, type PestelFactor } from "@/features/pestel/types/pestel-item";

const PESTEL_ATTACHMENT_BUCKET = "pestel-attachments";
const PESTEL_ALLOWED_ATTACHMENT_TYPES = ["application/pdf"];
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function isPestelFactor(value: string): value is PestelFactor {
  return pestelFactors.includes(value as PestelFactor);
}

function isAllowedAttachmentMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/") || PESTEL_ALLOWED_ATTACHMENT_TYPES.includes(mimeType);
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(dotIndex).toLowerCase();
}

async function uploadPestelAttachment(projectId: string, file: File): Promise<{ url: string; name: string; mimeType: string }> {
  const supabase = createSupabaseServerClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const extension = getFileExtension(safeName);
  const objectPath = `${projectId}/${Date.now()}-${crypto.randomUUID()}${extension}`;

  const { error: uploadError } = await supabase.storage.from(PESTEL_ATTACHMENT_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    throw new Error(`Failed to upload attachment: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(PESTEL_ATTACHMENT_BUCKET).getPublicUrl(objectPath);

  return {
    url: data.publicUrl,
    name: file.name,
    mimeType: file.type,
  };
}

export async function createPestelItemAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const projectFrameworkId = String(formData.get("projectFrameworkId") ?? "").trim();
  const factor = String(formData.get("factor") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();
  const attachmentRaw = formData.get("attachment");

  if (!projectId) throw new Error("Project id is required.");
  if (!isPestelFactor(factor)) throw new Error("Invalid PESTEL factor.");
  if (!content) throw new Error("PESTEL content is required.");
  if (!createdBy) throw new Error("Profile name is required.");

  await assertProjectHasVersion(projectId);

  let attachmentFile: File | null = null;
  if (attachmentRaw instanceof File && attachmentRaw.size > 0) {
    attachmentFile = attachmentRaw;
  }

  if (attachmentFile) {
    if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      throw new Error("첨부 파일은 최대 10MB까지 업로드할 수 있습니다.");
    }

    if (!attachmentFile.type || !isAllowedAttachmentMimeType(attachmentFile.type)) {
      throw new Error("이미지 또는 PDF 파일만 첨부할 수 있습니다.");
    }
  }

  const profile = await getProfileByName(createdBy);
  if (!profile) throw new Error("Profile not found in database.");

  const attachment = attachmentFile ? await uploadPestelAttachment(projectId, attachmentFile) : undefined;

  await createPestelItem(projectId, factor, content, profile.id, attachment, projectFrameworkId || undefined);

  revalidatePath(`/project/${projectId}/pestel`);
}

export async function deletePestelItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!itemId) throw new Error("PESTEL item id is required.");
  if (!projectId) throw new Error("Project id is required.");

  await deletePestelItem(itemId);

  revalidatePath(`/project/${projectId}/pestel`);
}

export async function updatePestelItemContentAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!itemId) throw new Error("PESTEL item id is required.");
  if (!projectId) throw new Error("Project id is required.");
  if (!content) throw new Error("PESTEL content is required.");

  await updatePestelItemContent(itemId, content);

  revalidatePath(`/project/${projectId}/pestel`);
}

export async function updatePestelItemsOrderAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const updatesRaw = String(formData.get("updates") ?? "").trim();

  if (!projectId) throw new Error("Project id is required.");
  if (!updatesRaw) throw new Error("PESTEL order updates are required.");

  let updates: Array<{ id: string; factor: PestelFactor; position: number }> = [];
  try {
    updates = JSON.parse(updatesRaw) as Array<{ id: string; factor: PestelFactor; position: number }>;
  } catch {
    throw new Error("Invalid PESTEL order updates payload.");
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("PESTEL order updates are required.");
  }

  for (const update of updates) {
    if (!update?.id || !isPestelFactor(update.factor) || typeof update.position !== "number") {
      throw new Error("Invalid PESTEL order update item.");
    }
  }

  await updatePestelItemsOrder(updates);

  revalidatePath(`/project/${projectId}/pestel`);
}
