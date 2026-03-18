"use server";

import { revalidatePath } from "next/cache";
import { getProfileByName } from "@/features/profiles/data/profile-repository";
import {
	createSwotItem,
	deleteSwotItem,
	updateSwotItemContent,
	updateSwotItemsOrder,
	updateSwotItemType as updateSwotItemTypeInRepository,
} from "@/features/swot/data/swot-repository";
import { swotTypes, type SwotType } from "@/features/swot/types/swot-item";

function isSwotType(value: string): value is SwotType {
	return swotTypes.includes(value as SwotType);
}

export async function createSwotItemAction(formData: FormData) {
	const projectId = String(formData.get("projectId") ?? "").trim();
	const projectFrameworkId = String(formData.get("projectFrameworkId") ?? "").trim();
	const type = String(formData.get("type") ?? "").trim();
	const content = String(formData.get("content") ?? "").trim();
	const createdBy = String(formData.get("createdBy") ?? "").trim();

	if (!projectId) {
		throw new Error("Project id is required.");
	}

	if (!isSwotType(type)) {
		throw new Error("Invalid SWOT type.");
	}

	if (!content) {
		throw new Error("SWOT content is required.");
	}

	if (!createdBy) {
		throw new Error("Profile name is required.");
	}

	const profile = await getProfileByName(createdBy);
	if (!profile) {
		throw new Error("Profile not found in database.");
	}

	await createSwotItem(projectId, type, content, profile.id, projectFrameworkId || undefined);
	revalidatePath(`/project/${projectId}/swot`);
}

export async function deleteSwotItemAction(formData: FormData) {
	const itemId = String(formData.get("itemId") ?? "").trim();
	const projectId = String(formData.get("projectId") ?? "").trim();

	if (!itemId) {
		throw new Error("SWOT item id is required.");
	}

	if (!projectId) {
		throw new Error("Project id is required.");
	}

	await deleteSwotItem(itemId);

	revalidatePath(`/project/${projectId}/swot`);
}

export async function updateSwotItemType(itemId: string, newType: SwotType) {
	if (!itemId) {
		throw new Error("SWOT item id is required.");
	}

	if (!isSwotType(newType)) {
		throw new Error("Invalid SWOT type.");
	}

	const updatedItem = await updateSwotItemTypeInRepository(itemId, newType);
	revalidatePath("/project/[id]/swot", "page");
	return updatedItem;
}

export async function updateSwotItemContentAction(formData: FormData) {
	const itemId = String(formData.get("itemId") ?? "").trim();
	const projectId = String(formData.get("projectId") ?? "").trim();
	const content = String(formData.get("content") ?? "").trim();

	if (!itemId) {
		throw new Error("SWOT item id is required.");
	}

	if (!projectId) {
		throw new Error("Project id is required.");
	}

	if (!content) {
		throw new Error("SWOT content is required.");
	}

	await updateSwotItemContent(itemId, content);
	revalidatePath(`/project/${projectId}/swot`);
}

export async function updateSwotItemsOrderAction(formData: FormData) {
	const projectId = String(formData.get("projectId") ?? "").trim();
	const updatesRaw = String(formData.get("updates") ?? "").trim();

	if (!projectId) {
		throw new Error("Project id is required.");
	}

	if (!updatesRaw) {
		throw new Error("SWOT order updates are required.");
	}

	let updates: Array<{ id: string; type: SwotType; position: number }> = [];
	try {
		updates = JSON.parse(updatesRaw) as Array<{ id: string; type: SwotType; position: number }>;
	} catch {
		throw new Error("Invalid SWOT order updates payload.");
	}

	if (!Array.isArray(updates) || updates.length === 0) {
		throw new Error("SWOT order updates are required.");
	}

	for (const update of updates) {
		if (!update?.id || !isSwotType(update.type) || typeof update.position !== "number") {
			throw new Error("Invalid SWOT order update item.");
		}
	}

	await updateSwotItemsOrder(updates);
	revalidatePath(`/project/${projectId}/swot`);
}
