"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFrameworkTitleAction } from "@/features/frameworks/actions/framework-actions";
import { pushToast } from "@/lib/utils/toast";

type SevenSData = {
  sharedValues: string;
  strategy: string;
  structure: string;
  systems: string;
  style: string;
  staff: string;
  skills: string;
};

type McKinsey7SCanvasProps = {
  projectId: string;
  frameworkId: string | null;
  initialData: SevenSData;
};

export function McKinsey7SCanvas({ projectId, frameworkId, initialData }: McKinsey7SCanvasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<SevenSData>(initialData);
  const [isCenterHovered, setIsCenterHovered] = useState(false);

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
        await updateFrameworkTitleAction(projectId, "MCKINSEY_7S", validFrameworkId, JSON.stringify(data));
        pushToast("McKinsey 7S 내용이 저장되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  const outerNodes: Array<{
    key: Exclude<keyof SevenSData, "sharedValues">;
    label: string;
  }> = [
    { key: "strategy", label: "Strategy" },
    { key: "structure", label: "Structure" },
    { key: "systems", label: "Systems" },
    { key: "style", label: "Style" },
    { key: "staff", label: "Staff" },
    { key: "skills", label: "Skills" },
  ];

  const nodeLayout = outerNodes.map((node, index) => {
    const angle = -150 + index * (360 / outerNodes.length);
    const radius = 34;
    const rad = (angle * Math.PI) / 180;

    return {
      ...node,
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    };
  });

  function getLineStyle(x: number, y: number) {
    const dx = x - 50;
    const dy = y - 50;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: "50%",
      top: "50%",
      width: `${length}%`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      transformOrigin: "0 50%",
    };
  }

  function getSegmentLineStyle(from: { x: number; y: number }, to: { x: number; y: number }) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: `${from.x}%`,
      top: `${from.y}%`,
      width: `${length}%`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      transformOrigin: "0 50%",
    };
  }

  const outerNodeClass = `absolute z-20 flex h-52 w-52 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-white p-5 text-center shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
    isCenterHovered ? "border-blue-200 bg-blue-50/40" : "border-gray-200"
  }`;

  return (
    <section className="relative space-y-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-500">저장 중...</p>
        </div>
      )}
      <div className="text-center">
        <p className="text-sm text-gray-400">Framework · McKinsey 7S</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Organizational Alignment Map</h2>
      </div>

      <div className="hidden md:block">
        <div className="relative mx-auto aspect-square w-full max-w-5xl">
          <div className="absolute inset-0 z-10">
            {nodeLayout.map((node) => (
              <div
                key={`line-${node.key}`}
                className="absolute h-px bg-gray-300/20 print:bg-gray-300/30"
                style={getLineStyle(node.x, node.y)}
              />
            ))}

            {nodeLayout.map((node, index) => {
              const nextNode = nodeLayout[(index + 1) % nodeLayout.length];
              return (
                <div
                  key={`outer-line-${node.key}-${nextNode.key}`}
                  className="absolute h-px bg-gray-300/15 print:bg-gray-300/25"
                  style={getSegmentLineStyle(node, nextNode)}
                />
              );
            })}
          </div>

          {nodeLayout.map((node) => (
            <article key={node.key} className={outerNodeClass} style={{ left: `${node.x}%`, top: `${node.y}%` }}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{node.label}</p>
              <textarea
                className="h-20 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-700 outline-none transition-all focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                value={data[node.key]}
                onChange={(e) => setData((prev) => ({ ...prev, [node.key]: e.target.value }))}
              />
            </article>
          ))}

          <article
            className="absolute left-1/2 top-1/2 z-30 flex h-72 w-72 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50 p-8 text-center shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            onMouseEnter={() => setIsCenterHovered(true)}
            onMouseLeave={() => setIsCenterHovered(false)}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Shared Values</p>
            <textarea
              className="mt-3 h-32 w-full resize-none rounded-xl border border-blue-200 bg-white p-3 text-center text-sm text-gray-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              value={data.sharedValues}
              onChange={(e) => setData((prev) => ({ ...prev, sharedValues: e.target.value }))}
            />
          </article>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        <article className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Shared Values</p>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-blue-200 bg-white p-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            value={data.sharedValues}
            onChange={(e) => setData((prev) => ({ ...prev, sharedValues: e.target.value }))}
          />
        </article>
        <div className="grid grid-cols-2 gap-3">
          {outerNodes.map((node) => (
            <article
              key={`mobile-${node.key}`}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{node.label}</p>
              <textarea
                className="h-24 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                value={data[node.key]}
                onChange={(e) => setData((prev) => ({ ...prev, [node.key]: e.target.value }))}
              />
            </article>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" disabled={isPending} onClick={save} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200">
          {isPending ? "저장 중..." : "7S 저장"}
        </button>
      </div>
    </section>
  );
}
