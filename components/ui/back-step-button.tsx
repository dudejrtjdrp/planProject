"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";

type BackStepButtonProps = {
  fallbackHref: string;
  label?: string;
};

export function BackStepButton({ fallbackHref, label = "이전 단계" }: BackStepButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleClick() {
    setIsNavigating(true);
    router.push(fallbackHref);
  }

  return (
    <>
      {isNavigating ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <PageLoadingBar />
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">페이지 이동 중...</p>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
      >
        ← {label}
      </button>
    </>
  );
}
