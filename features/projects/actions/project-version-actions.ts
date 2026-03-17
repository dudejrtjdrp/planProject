"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectVersionSnapshot,
  restoreProjectVersion,
} from "@/features/projects/data/project-repository";

export async function createProjectVersionAction(projectId: string): Promise<{ version: number }> {
  if (!projectId) {
    throw new Error("Project id is required.");
  }

  const snapshot = await createProjectVersionSnapshot(projectId);
  revalidatePath(`/project/${projectId}`);
  return { version: snapshot.version };
}

export async function restoreProjectVersionAction(projectId: string, version: number): Promise<void> {
  if (!projectId) {
    throw new Error("Project id is required.");
  }

  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Invalid project version.");
  }

  await restoreProjectVersion(projectId, version);
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/projects");
}
