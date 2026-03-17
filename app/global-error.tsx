"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const CHUNK_RELOAD_KEY = "__chunk_reload_once__";

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const message = error?.message ?? "";
    const isChunkError = /ChunkLoadError|Loading chunk/i.test(message);

    if (!isChunkError) {
      return;
    }

    const alreadyReloaded = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
    if (alreadyReloaded) {
      return;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#F9FAFB]">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">일시적인 로딩 오류가 발생했습니다.</h1>
            <p className="mt-2 text-sm text-gray-700">페이지를 새로고침하거나 다시 시도해 주세요.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95"
              >
                새로고침
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-95"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
