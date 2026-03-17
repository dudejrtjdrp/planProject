"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type ProfileGateProps = {
  children: ReactNode;
};

export function ProfileGate({ children }: ProfileGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const currentUser = window.localStorage.getItem(CURRENT_USER_KEY);

    if (!currentUser) {
      router.replace(`/profile?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsReady(true);
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="mx-auto w-full max-w-5xl p-8">
        <PageLoadingBar />
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-gray-700">프로필을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
