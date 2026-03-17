"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";

const MIN_VISIBLE_MS = 320;

export function GlobalRouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, MIN_VISIBLE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [routeKey]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[65]">
      <PageLoadingBar />
    </div>
  );
}
