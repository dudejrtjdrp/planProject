export type Profile = {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
};

export const FIXED_PROFILE_ORDER = ["성효", "죤슨빌", "믹자", "지건", "Guest"] as const;

export const GUEST_PROFILE_NAME = "Guest";

export const FIXED_PROFILE_COLORS: Record<string, string> = {
  성효: "#3B82F6",
  죤슨빌: "#8B5CF6",
  믹자: "#10B981",
  지건: "#F59E0B",
  Guest: "#64748B",
};
