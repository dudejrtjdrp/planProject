import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toFrameworkDbKey } from "@/features/frameworks/types/framework";
import type { FrameworkDbKey } from "@/features/frameworks/types/framework";
import type { ProjectMeetingNote } from "@/features/projects/types/project-meeting-note";

type ProjectMeetingNoteRow = {
  id: string;
  project_id: string;
  framework_key: FrameworkDbKey;
  title: string;
  content: string;
  meeting_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapProjectMeetingNoteRow(row: ProjectMeetingNoteRow): ProjectMeetingNote {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    meetingDate: row.meeting_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PROJECT_NOTE_KEY = toFrameworkDbKey("SWOT");

export async function getProjectMeetingNotes(projectId: string): Promise<ProjectMeetingNote[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("framework_meeting_notes")
    .select("id, project_id, framework_key, title, content, meeting_date, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load project meeting notes: ${error.message}`);
  }

  return ((data ?? []) as ProjectMeetingNoteRow[]).map(mapProjectMeetingNoteRow);
}

export async function createProjectMeetingNote(input: {
  projectId: string;
  title: string;
  content: string;
  meetingDate: string;
  createdBy: string;
}): Promise<ProjectMeetingNote> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("framework_meeting_notes")
    .insert({
      project_id: input.projectId,
      framework_key: PROJECT_NOTE_KEY,
      title: input.title,
      content: input.content,
      meeting_date: input.meetingDate,
      created_by: input.createdBy,
    })
    .select("id, project_id, framework_key, title, content, meeting_date, created_by, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create project meeting note: ${error.message}`);
  }

  return mapProjectMeetingNoteRow(data as ProjectMeetingNoteRow);
}

export async function updateProjectMeetingNote(input: {
  noteId: string;
  title: string;
  content: string;
  meetingDate: string;
}): Promise<ProjectMeetingNote> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("framework_meeting_notes")
    .update({
      title: input.title,
      content: input.content,
      meeting_date: input.meetingDate,
    })
    .eq("id", input.noteId)
    .select("id, project_id, framework_key, title, content, meeting_date, created_by, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update project meeting note: ${error.message}`);
  }

  return mapProjectMeetingNoteRow(data as ProjectMeetingNoteRow);
}

export async function deleteProjectMeetingNote(noteId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("framework_meeting_notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(`Failed to delete project meeting note: ${error.message}`);
  }
}
