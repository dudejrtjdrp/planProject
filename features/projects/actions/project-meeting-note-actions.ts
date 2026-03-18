"use server";

import { revalidatePath } from "next/cache";
import { getProfileByName } from "@/features/profiles/data/profile-repository";
import {
  createProjectMeetingNote,
  deleteProjectMeetingNote,
} from "@/features/projects/data/project-meeting-note-repository";

export async function createProjectMeetingNoteAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  const createdBy = String(formData.get("createdBy") ?? "").trim();

  if (!projectId) {
    throw new Error("Project id is required.");
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

  const profile = await getProfileByName(createdBy);
  if (!profile) {
    throw new Error("Profile not found in database.");
  }

  await createProjectMeetingNote({
    projectId,
    title,
    content,
    meetingDate,
    createdBy: profile.id,
  });

  revalidatePath(`/project/${projectId}/meeting-notes`);
}

export async function deleteProjectMeetingNoteAction(formData: FormData) {
  const noteId = String(formData.get("noteId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!noteId) {
    throw new Error("Meeting note id is required.");
  }

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  await deleteProjectMeetingNote(noteId);

  revalidatePath(`/project/${projectId}/meeting-notes`);
}
