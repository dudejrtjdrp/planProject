"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
    return null;
  }

  return <>{children}</>;
}
