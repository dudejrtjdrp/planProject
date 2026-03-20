"use server";

import { revalidatePath } from "next/cache";
import { frameworkKeys, type FrameworkKey } from "@/features/frameworks/types/framework";
import { getProfileByName } from "@/features/profiles/data/profile-repository";
import { assertProjectHasVersion } from "@/features/projects/data/project-repository";
import {
  createFrameworkMeetingNote,
  deleteFrameworkMeetingNote,
} from "@/features/frameworks/data/framework-meeting-note-repository";

function isFrameworkKey(value: string): value is FrameworkKey {
  return frameworkKeys.includes(value as FrameworkKey);
}

export async function createFrameworkMeetingNoteAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const frameworkKey = String(formData.get("frameworkKey") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  if (!isFrameworkKey(frameworkKey)) {
    throw new Error("Invalid framework key.");
  }

  if (!title) {
    throw new Error("회의 제목을 입력해 주세요.");
  }

  if (!content) {
    throw new Error("회의 내용을 입력해 주세요.");
  }

  if (!meetingDate) {
    throw new Error("회의 일자를 선택해 주세요.");
  }

  if (!createdBy) {
    throw new Error("프로필을 먼저 선택해 주세요.");
  }

  await assertProjectHasVersion(projectId);

  const profile = await getProfileByName(createdBy);
  if (!profile) {
    throw new Error("Profile not found in database.");
  }

  await createFrameworkMeetingNote({
    projectId,
    frameworkKey,
    title,
    content,
    meetingDate,
    createdBy: profile.id,
  });

  revalidatePath(`/project/${projectId}/meeting-notes`);
}

export async function deleteFrameworkMeetingNoteAction(formData: FormData) {
  const noteId = String(formData.get("noteId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!noteId) {
    throw new Error("Meeting note id is required.");
  }

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  await deleteFrameworkMeetingNote(noteId);

  revalidatePath(`/project/${projectId}/meeting-notes`);
}
