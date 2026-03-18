import type { FrameworkKey } from "@/features/frameworks/types/framework";

export type FrameworkMeetingNote = {
  id: string;
  projectId: string;
  frameworkKey: FrameworkKey;
  title: string;
  content: string;
  meetingDate: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
