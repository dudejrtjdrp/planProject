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
  initialData: MatrixData;
};

export function DoubleMatrixBoard({ projectId, frameworkId, initialData }: DoubleMatrixBoardProps) {
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
    <section className="relative space-y-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-500">저장 중...</p>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-400">Framework · Double Matrix</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">2x2 Strategic Matrix</h2>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-4 grid grid-cols-[120px_1fr] gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Y Axis</span>
          <input className="h-10 rounded-xl border border-gray-200 px-3" value={data.yAxis} onChange={(e) => setData((prev) => ({ ...prev, yAxis: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-x border-y border-gray-300 p-4">
          <article className={`${quadrantClass} bg-blue-50`}>
            <p className="mb-2 text-sm font-semibold text-gray-900">Q1</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-blue-100 bg-white p-3" value={data.q1} onChange={(e) => setData((prev) => ({ ...prev, q1: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-green-50`}>
            <p className="mb-2 text-sm font-semibold text-gray-900">Q2</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-green-100 bg-white p-3" value={data.q2} onChange={(e) => setData((prev) => ({ ...prev, q2: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-yellow-50`}>
            <p className="mb-2 text-sm font-semibold text-gray-900">Q3</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-yellow-100 bg-white p-3" value={data.q3} onChange={(e) => setData((prev) => ({ ...prev, q3: e.target.value }))} />
          </article>
          <article className={`${quadrantClass} bg-red-50`}>
            <p className="mb-2 text-sm font-semibold text-gray-900">Q4</p>
            <textarea className="h-28 w-full resize-none rounded-xl border border-red-100 bg-white p-3" value={data.q4} onChange={(e) => setData((prev) => ({ ...prev, q4: e.target.value }))} />
          </article>
        </div>

        <div className="mt-4 grid grid-cols-[120px_1fr] gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">X Axis</span>
          <input className="h-10 rounded-xl border border-gray-200 px-3" value={data.xAxis} onChange={(e) => setData((prev) => ({ ...prev, xAxis: e.target.value }))} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" disabled={isPending} onClick={save} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200">
          {isPending ? "저장 중..." : "Matrix 저장"}
        </button>
      </div>
    </section>
  );
}
