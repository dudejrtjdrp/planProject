import type { FrameworkKey } from "@/features/frameworks/types/framework";

export type ProjectFrameworkAttachment = {
  framework: FrameworkKey;
  status: "not_started" | "in_progress" | "completed";
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  frameworks: ProjectFrameworkAttachment[];
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
};
