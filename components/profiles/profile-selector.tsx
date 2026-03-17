"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/features/profiles/types/profile";
import { GUEST_PROFILE_NAME } from "@/features/profiles/types/profile";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type ProfileSelectorProps = {
  profiles: Profile[];
};

export function ProfileSelector({ profiles }: ProfileSelectorProps) {
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const guestProfile = useMemo(
    () => profiles.find((profile) => profile.name === GUEST_PROFILE_NAME) ?? null,
    [profiles],
  );

  const mainProfiles = useMemo(
    () => profiles.filter((profile) => profile.name !== GUEST_PROFILE_NAME).slice(0, 4),
    [profiles],
  );

  useEffect(() => {
    const savedProfileId = window.localStorage.getItem(CURRENT_USER_KEY);
    setSelectedProfileId(savedProfileId);
  }, []);

  function selectProfile(profile: Profile) {
    window.localStorage.setItem(CURRENT_USER_KEY, profile.name);
    setSelectedProfileId(profile.name);
    router.push("/projects");
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose a Profile</h1>
        <p className="mt-3 text-base text-gray-700">Select your internal identity to continue.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mainProfiles.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => selectProfile(profile)}
                className={`rounded-3xl border bg-white p-6 text-left shadow-sm transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? "border-[#3182F6] ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="mb-4 h-14 w-14 rounded-full"
                  style={{ backgroundColor: profile.avatarColor }}
                  aria-hidden
                />
                <p className="text-base font-semibold text-gray-900">{profile.name}</p>
                <p className="mt-1 text-xs text-gray-400">{isSelected ? "Currently selected" : "Click to use profile"}</p>
              </button>
            );
          })}
        </div>

        {guestProfile ? (
          <aside className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-6 lg:w-52">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Guest</p>
            <button
              type="button"
              onClick={() => selectProfile(guestProfile)}
              className={`w-full rounded-3xl border bg-white p-6 text-left shadow-sm transition-all duration-200 active:scale-95 ${
                  selectedProfileId === guestProfile.name
                  ? "border-[#3182F6] ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="mb-4 h-14 w-14 rounded-full"
                style={{ backgroundColor: guestProfile.avatarColor }}
                aria-hidden
              />
              <p className="text-base font-semibold text-gray-900">{guestProfile.name}</p>
              <p className="mt-1 text-xs text-gray-400">
                {selectedProfileId === guestProfile.name ? "Currently selected" : "Click to use profile"}
              </p>
            </button>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
