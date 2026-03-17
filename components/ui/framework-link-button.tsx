"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoadingBar } from "@/components/ui/page-loading-bar";

type FrameworkLinkButtonProps = {
  href: string;
  label: string;
};

export function FrameworkLinkButton({ href, label }: FrameworkLinkButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleNavigate() {
    setIsNavigating(true);
    router.push(href);
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
        onClick={handleNavigate}
        className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-[#3182F6] hover:bg-blue-50 hover:text-[#3182F6] active:scale-95"
      >
        {label}
      </button>
    </>
  );
}
