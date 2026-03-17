"use client";

import { useFormStatus } from "react-dom";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";

type FormPendingOverlayProps = {
  message?: string;
  visible?: boolean;
};

export function FormPendingOverlay({ message = "요청 처리 중...", visible }: FormPendingOverlayProps) {
  const { pending } = useFormStatus();
  const shouldShow = visible ?? pending;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <PageLoadingBar />
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
