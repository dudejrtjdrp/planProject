"use client";

import { useEffect, useRef, useState } from "react";
import { appToastEventName, type AppToastDetail } from "@/lib/utils/toast";

type ToastState = {
  id: number;
  message: string;
  type: "success" | "error";
};

export function ToastViewport() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function onToast(event: Event) {
      const customEvent = event as CustomEvent<AppToastDetail>;
      const detail = customEvent.detail;
      if (!detail?.message) {
        return;
      }

      const next: ToastState = {
        id: Date.now(),
        message: detail.message,
        type: detail.type === "error" ? "error" : "success",
      };

      setToast(next);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setToast(null), 2200);
    }

    window.addEventListener(appToastEventName, onToast as EventListener);
    return () => {
      window.removeEventListener(appToastEventName, onToast as EventListener);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
      <div
        className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm ${
          toast.type === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}
