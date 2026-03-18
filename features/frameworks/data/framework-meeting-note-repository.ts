import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fromFrameworkDbKey,
  toFrameworkDbKey,
  type FrameworkDbKey,
  type FrameworkKey,
} from "@/features/frameworks/types/framework";
import type { FrameworkMeetingNote } from "@/features/frameworks/types/framework-meeting-note";

type FrameworkMeetingNoteRow = {
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

function mapFrameworkMeetingNoteRow(row: FrameworkMeetingNoteRow): FrameworkMeetingNote {
  return {
    id: row.id,
    projectId: row.project_id,
    frameworkKey: fromFrameworkDbKey(row.framework_key),
    title: row.title,
    content: row.content,
    meetingDate: row.meeting_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFrameworkMeetingNotes(
  projectId: string,
  frameworkKey?: FrameworkKey,
): Promise<FrameworkMeetingNote[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("framework_meeting_notes")
    .select("id, project_id, framework_key, title, content, meeting_date, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (frameworkKey) {
    query = query.eq("framework_key", toFrameworkDbKey(frameworkKey));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load framework meeting notes: ${error.message}`);
  }

  return ((data ?? []) as FrameworkMeetingNoteRow[]).map(mapFrameworkMeetingNoteRow);
}

export async function createFrameworkMeetingNote(input: {
  projectId: string;
  frameworkKey: FrameworkKey;
  title: string;
  content: string;
  meetingDate: string;
  createdBy: string;
}): Promise<FrameworkMeetingNote> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("framework_meeting_notes")
    .insert({
      project_id: input.projectId,
      framework_key: toFrameworkDbKey(input.frameworkKey),
      title: input.title,
      content: input.content,
      meeting_date: input.meetingDate,
      created_by: input.createdBy,
    })
    .select("id, project_id, framework_key, title, content, meeting_date, created_by, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create framework meeting note: ${error.message}`);
  }

  return mapFrameworkMeetingNoteRow(data as FrameworkMeetingNoteRow);
}

export async function deleteFrameworkMeetingNote(noteId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("framework_meeting_notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(`Failed to delete framework meeting note: ${error.message}`);
  }
}
