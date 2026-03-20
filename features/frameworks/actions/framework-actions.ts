"use server";

import { revalidatePath } from "next/cache";
import { attachFrameworkToProject, getFrameworkById, updateFrameworkTitle } from "@/features/frameworks/data/framework-repository";
import { clonePestelItemsToFramework } from "@/features/pestel/data/pestel-repository";
import { assertProjectHasVersion } from "@/features/projects/data/project-repository";
import { cloneSwotItemsToFramework } from "@/features/swot/data/swot-repository";
import type { FrameworkKey } from "@/features/frameworks/types/framework";

function revalidateFrameworkPath(projectId: string, frameworkKey: FrameworkKey) {
  if (frameworkKey === "SWOT") {
    revalidatePath(`/project/${projectId}/swot`);
  }
  if (frameworkKey === "PESTEL") {
    revalidatePath(`/project/${projectId}/pestel`);
  }
  if (frameworkKey === "MCKINSEY_7S") {
    revalidatePath(`/project/${projectId}/mckinsey-7s`);
  }
  if (frameworkKey === "MATRIX_2X2") {
    revalidatePath(`/project/${projectId}/double-matrix`);
  }
  if (frameworkKey === "PERSONA_MODEL") {
    revalidatePath(`/project/${projectId}/persona-model`);
  }
  if (frameworkKey === "COMPETITOR_MAPPING") {
    revalidatePath(`/project/${projectId}/3c-analysis`);
  }
}

export async function createFrameworkVersionAction(
  projectId: string,
  frameworkKey: FrameworkKey,
  sourceFrameworkId?: string | null,
): Promise<{ version: number }> {
  if (!projectId) {
    throw new Error("Project id is required.");
  }

  await assertProjectHasVersion(projectId);

  const framework = await attachFrameworkToProject(projectId, frameworkKey);

  if (sourceFrameworkId) {
    const sourceFramework = await getFrameworkById(sourceFrameworkId);
    if (sourceFramework?.title) {
      await updateFrameworkTitle(framework.id, sourceFramework.title);
    }

    if (frameworkKey === "SWOT") {
      await cloneSwotItemsToFramework(sourceFrameworkId, framework.id);
    }

    if (frameworkKey === "PESTEL") {
      await clonePestelItemsToFramework(sourceFrameworkId, framework.id);
    }
  }

  revalidateFrameworkPath(projectId, frameworkKey);
  return { version: framework.version };
}

export async function updateFrameworkTitleAction(
  projectId: string,
  frameworkKey: FrameworkKey,
  frameworkId: string,
  content: string,
): Promise<void> {
  if (!projectId || !frameworkId) {
    throw new Error("Project id and framework id are required.");
  }

  await updateFrameworkTitle(frameworkId, content);
  revalidateFrameworkPath(projectId, frameworkKey);
}
