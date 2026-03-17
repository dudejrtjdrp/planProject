import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/features/profiles/types/profile";
import { FIXED_PROFILE_ORDER } from "@/features/profiles/types/profile";

type ProfileRow = {
  id: string;
  name: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
};

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_color, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load profiles: ${error.message}`);
  }

  const profiles = ((data ?? []) as ProfileRow[]).map(mapProfileRow);
  const orderMap = new Map<string, number>(FIXED_PROFILE_ORDER.map((name, index) => [name, index]));

  return profiles
    .filter((profile) => orderMap.has(profile.name))
    .sort((left, right) => (orderMap.get(left.name) ?? 999) - (orderMap.get(right.name) ?? 999));
}

export async function getProfileByName(name: string): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_color, created_at, updated_at")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile by name: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data as ProfileRow);
}
