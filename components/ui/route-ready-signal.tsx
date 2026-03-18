"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const ROUTE_READY_EVENT = "planproject:route-ready";

type RouteReadyDetail = {
  routeKey: string;
};

export function RouteReadySignal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<RouteReadyDetail>(ROUTE_READY_EVENT, {
        detail: { routeKey },
      }),
    );
  }, [routeKey]);

  return null;
}