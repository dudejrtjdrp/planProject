"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFrameworkTitleAction } from "@/features/frameworks/actions/framework-actions";
import { pushToast } from "@/lib/utils/toast";

type MatrixData = {
  xAxis: string;
  yAxis: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
};

type DoubleMatrixBoardProps = {
  projectId: string;
  frameworkId: string | null;
  currentVersion: number | null;
  initialData: MatrixData;
};

export function DoubleMatrixBoard({ projectId, frameworkId, currentVersion, initialData }: DoubleMatrixBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<MatrixData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  if (!frameworkId) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <p className="text-sm text-gray-600">버전이 없습니다. 상단에서 새 버전을 먼저 생성해 주세요.</p>
      </div>
    );
  }

  const validFrameworkId = frameworkId as string;

  function save() {
    startTransition(async () => {
      try {
        await updateFrameworkTitleAction(projectId, "MATRIX_2X2", validFrameworkId, JSON.stringify(data));
        pushToast("Double Matrix 내용이 저장되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  const quadrantClass = "rounded-2xl border border-gray-200 p-5 shadow-sm";

  return (
    <section className="relative space-y-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:shadow-none print:p-8 print:space-y-6">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm print:hidden">
          <p className="text-sm font-medium text-gray-500">\uc800\uc7a5 \uc911...</p>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-400 print:text-xs">Framework · Double Matrix</p>
        {currentVersion ? (
          <p className="mt-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              v{currentVersion}
            </span>
          </p>
        ) : null}
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 print:text-2xl">2x2 Strategic Matrix</h2>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 print:p-4">
        <div className="mb-4 grid grid-cols-[120px_1fr] gap-4 print:gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 print:text-[10px]">Y Axis</span>
          <input className="h-10 rounded-xl border border-gray-200 px-3 print:h-8 print:text-xs" value={data.yAxis} onChange={(e) => setData((prev) => ({ ...prev, yAxis: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-x border-y border-gray-300 p-4 print:gap-3 print:p-3">
          <article className={`${quadrantClass} bg-blue-50 print:shadow-none print:p-3`}>
            <p className="mb-2 text-sm font-semibold text-gray-900 print:text-xs">Q1</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-blue-100 bg-white p-3 print:h-20 print:p-2 print:text-xs" value={data.q1} onChange={(e) => setData((prev) => ({ ...prev, q1: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-green-50 print:shadow-none print:p-3`}>
            <p className="mb-2 text-sm font-semibold text-gray-900 print:text-xs">Q2</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-green-100 bg-white p-3 print:h-20 print:p-2 print:text-xs" value={data.q2} onChange={(e) => setData((prev) => ({ ...prev, q2: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-yellow-50 print:shadow-none print:p-3`}>
            <p className="mb-2 text-sm font-semibold text-gray-900 print:text-xs">Q3</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-yellow-100 bg-white p-3 print:h-20 print:p-2 print:text-xs" value={data.q3} onChange={(e) => setData((prev) => ({ ...prev, q3: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-red-50 print:shadow-none print:p-3`}>
            <p className="mb-2 text-sm font-semibold text-gray-900 print:text-xs">Q4</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-red-100 bg-white p-3 print:h-20 print:p-2 print:text-xs" value={data.q4} onChange={(e) => setData((prev) => ({ ...prev, q4: e.target.value }))} />
          </article>
        </div>

        <div className="mt-4 grid grid-cols-[120px_1fr] gap-4 print:gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 print:text-[10px]">X Axis</span>
          <input className="h-10 rounded-xl border border-gray-200 px-3 print:h-8 print:text-xs" value={data.xAxis} onChange={(e) => setData((prev) => ({ ...prev, xAxis: e.target.value }))} />
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <button type="button" disabled={isPending} onClick={save} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200">
          {isPending ? "저장 중..." : "Matrix 저장"}
        </button>
      </div>
    </section>
  );
}
