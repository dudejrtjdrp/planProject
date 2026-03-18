export type ProjectMeetingNote = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  meetingDate: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
