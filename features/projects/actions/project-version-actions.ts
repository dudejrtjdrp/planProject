"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectVersionSnapshot,
  getProjectVersion,
  restoreProjectVersion,
} from "@/features/projects/data/project-repository";

export async function createProjectVersionAction(input: {
  projectId: string;
  editorName?: string | null;
  commitMessage?: string | null;
  isDraft?: boolean;
}): Promise<{ version: number }> {
  if (!input.projectId) {
    throw new Error("Project id is required.");
  }

  const snapshot = await createProjectVersionSnapshot(input.projectId, {
    editorName: input.editorName ?? null,
    commitMessage: input.commitMessage ?? null,
    isDraft: input.isDraft,
  });
  revalidatePath(`/project/${input.projectId}`);
  revalidatePath("/projects");
  return { version: snapshot.version };
}

export async function getProjectVersionSnapshotAction(input: {
  projectId: string;
  version: number;
}): Promise<{ version: Awaited<ReturnType<typeof getProjectVersion>> }> {
  if (!input.projectId) {
    throw new Error("Project id is required.");
  }

  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error("Invalid project version.");
  }

  const version = await getProjectVersion(input.projectId, input.version);
  return { version };
}

export async function restoreProjectVersionAction(input: {
  projectId: string;
  version: number;
  expectedUpdatedAt?: string | null;
  editorName?: string | null;
}): Promise<void> {
  const projectId = input.projectId;
  const version = input.version;

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Invalid project version.");
  }

  await restoreProjectVersion(projectId, version, {
    expectedUpdatedAt: input.expectedUpdatedAt ?? null,
    editorName: input.editorName ?? null,
  });
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/projects");
}
