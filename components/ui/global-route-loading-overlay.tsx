"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";
import { ROUTE_READY_EVENT } from "@/components/ui/route-ready-signal";

const MIN_VISIBLE_MS = 700;
const FAILSAFE_HIDE_MS = 12000;

type RouteReadyEvent = CustomEvent<{ routeKey: string }>;

export function GlobalRouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [isRouteReady, setIsRouteReady] = useState(false);
  const routeStartTimeRef = useRef<number>(Date.now());
  const routeKeyRef = useRef<string>("");

  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    routeKeyRef.current = routeKey;
    routeStartTimeRef.current = Date.now();
    setVisible(true);
    setIsRouteReady(false);

    const failsafeTimer = window.setTimeout(() => {
      setVisible(false);
      setIsRouteReady(false);
    }, FAILSAFE_HIDE_MS);

    return () => {
      window.clearTimeout(failsafeTimer);
    };
  }, [routeKey]);

  useEffect(() => {
    function handleRouteReady(event: Event) {
      const customEvent = event as RouteReadyEvent;
      if (customEvent.detail?.routeKey !== routeKeyRef.current) {
        return;
      }

      setIsRouteReady(true);
    }

    window.addEventListener(ROUTE_READY_EVENT, handleRouteReady as EventListener);
    return () => {
      window.removeEventListener(ROUTE_READY_EVENT, handleRouteReady as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isRouteReady) {
      return;
    }

    const elapsed = Date.now() - routeStartTimeRef.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const timer = window.setTimeout(() => {
      setVisible(false);
      setIsRouteReady(false);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isRouteReady]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[65]">
      <PageLoadingBar />
    </div>
  );
}
