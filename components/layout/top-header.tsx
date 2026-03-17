"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FIXED_PROFILE_COLORS } from "@/features/profiles/types/profile";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";
import { navigationItems } from "@/lib/config/navigation";

type SelectedProfilePreview = {
  name: string;
  color: string;
};

export function TopHeader() {
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfilePreview | null>(null);

  useEffect(() => {
    const name = window.localStorage.getItem(CURRENT_USER_KEY);

    if (!name) {
      setSelectedProfile(null);
      return;
    }

    setSelectedProfile({
      name,
      color: FIXED_PROFILE_COLORS[name] ?? "#64748B",
    });
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-8 py-5">
        <div>
          <p className="text-sm text-gray-400">Dashboard</p>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Strategic Planning</h1>
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {selectedProfile ? (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedProfile.color }}
                aria-hidden
              />
              <span className="text-sm font-medium text-gray-700">{selectedProfile.name}</span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
