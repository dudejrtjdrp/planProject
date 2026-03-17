"use server";

import { revalidatePath } from "next/cache";
import { createProject, deleteProject, updateProject } from "@/features/projects/data/project-repository";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const descriptionValue = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("Project name is required.");
  }

  const project = await createProject({
    name,
    description: descriptionValue ? descriptionValue : null,
  });

  revalidatePath("/projects");
  return { ok: true as const, projectId: project.id };
}

export async function deleteProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  await deleteProject(projectId);

  revalidatePath("/projects");
  revalidatePath(`/project/${projectId}`);

  return { ok: true as const, projectId };
}

export async function updateProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const descriptionValue = String(formData.get("description") ?? "").trim();

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  if (!name) {
    throw new Error("Project name is required.");
  }

  await updateProject(projectId, {
    name,
    description: descriptionValue ? descriptionValue : null,
  });

  revalidatePath("/projects");
  revalidatePath(`/project/${projectId}`);

  return { ok: true as const, projectId };
}
