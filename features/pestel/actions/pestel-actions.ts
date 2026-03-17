"use server";

import { revalidatePath } from "next/cache";
import { getProfileByName } from "@/features/profiles/data/profile-repository";
import {
  createPestelItem,
  deletePestelItem,
  updatePestelItemContent,
  updatePestelItemsOrder,
} from "@/features/pestel/data/pestel-repository";
import { pestelFactors, type PestelFactor } from "@/features/pestel/types/pestel-item";

function isPestelFactor(value: string): value is PestelFactor {
  return pestelFactors.includes(value as PestelFactor);
}

export async function createPestelItemAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const projectFrameworkId = String(formData.get("projectFrameworkId") ?? "").trim();
  const factor = String(formData.get("factor") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();

  if (!projectId) throw new Error("Project id is required.");
  if (!isPestelFactor(factor)) throw new Error("Invalid PESTEL factor.");
  if (!content) throw new Error("PESTEL content is required.");
  if (!createdBy) throw new Error("Profile name is required.");

  const profile = await getProfileByName(createdBy);
  if (!profile) throw new Error("Profile not found in database.");

  await createPestelItem(projectId, factor, content, profile.id, projectFrameworkId || undefined);

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
