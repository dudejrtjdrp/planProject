"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";
import { FIXED_PROFILE_COLORS, GUEST_PROFILE_NAME } from "@/features/profiles/types/profile";

const profiles = Object.entries(FIXED_PROFILE_COLORS).map(([name, color]) => ({ name, color }));

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F9FAFB] px-8 py-16">
          <section className="mx-auto w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-700">프로필 페이지를 불러오는 중...</p>
          </section>
        </main>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUser = window.localStorage.getItem(CURRENT_USER_KEY);
    const isSwitchMode = searchParams.get("switch") === "1";

    if (currentUser && !isSwitchMode) {
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    }
  }, [router, searchParams]);

  function handleSelectProfile(profileName: string) {
    window.localStorage.setItem(CURRENT_USER_KEY, profileName);
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
  }

  const guest = profiles.find((profile) => profile.name === GUEST_PROFILE_NAME);
  const mainProfiles = profiles.filter((profile) => profile.name !== GUEST_PROFILE_NAME);

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-8 py-16">
      <section className="mx-auto w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">프로필 선택</h1>
          <p className="mt-3 text-base text-gray-700">작업할 프로필을 선택하세요</p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            {mainProfiles.map((profile) => (
              <button
                key={profile.name}
                type="button"
                onClick={() => handleSelectProfile(profile.name)}
                className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 active:scale-95"
              >
                <div
                  className="mx-auto mb-5 h-20 w-20 rounded-full"
                  style={{ backgroundColor: profile.color }}
                  aria-hidden
                />
                <p className="text-xl font-semibold text-gray-900">{profile.name}</p>
              </button>
            ))}
          </div>

          {guest ? (
            <aside className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <p className="mb-4 text-sm font-semibold text-gray-400">Guest</p>
              <button
                type="button"
                onClick={() => handleSelectProfile(guest.name)}
                className="w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 active:scale-95"
              >
                <div className="mx-auto mb-5 h-20 w-20 rounded-full" style={{ backgroundColor: guest.color }} aria-hidden />
                <p className="text-xl font-semibold text-gray-900">{guest.name}</p>
              </button>
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  );
}
