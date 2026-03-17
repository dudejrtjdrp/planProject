"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFrameworkTitleAction } from "@/features/frameworks/actions/framework-actions";
import { pushToast } from "@/lib/utils/toast";

type PersonaData = {
  name: string;
  age: string;
  role: string;
  bio: string;
  goals: string;
  painPoints: string;
  behaviors: string;
  needs: string;
  motivations: string;
};

type PersonaModelCanvasProps = {
  projectId: string;
  frameworkId: string | null;
  initialData: PersonaData;
};

export function PersonaModelCanvas({ projectId, frameworkId, initialData }: PersonaModelCanvasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PersonaData>(initialData);

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
        await updateFrameworkTitleAction(projectId, "PERSONA_MODEL", validFrameworkId, JSON.stringify(data));
        pushToast("Persona Model 내용이 저장되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  function setField<K extends keyof PersonaData>(key: K, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const sectionClass = "rounded-2xl bg-gray-50 p-5";

  return (
    <section className="relative space-y-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-500">저장 중...</p>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-400">Framework · Persona Model</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Human-Centered Persona Board</h2>
      </div>

      <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-[88px_1fr] gap-5">
          <div className="flex h-22 w-22 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {data.name?.[0] ?? "P"}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="h-10 rounded-xl border border-gray-200 px-3" placeholder="Name" value={data.name} onChange={(e) => setField("name", e.target.value)} />
            <input className="h-10 rounded-xl border border-gray-200 px-3" placeholder="Age" value={data.age} onChange={(e) => setField("age", e.target.value)} />
            <input className="h-10 rounded-xl border border-gray-200 px-3" placeholder="Role" value={data.role} onChange={(e) => setField("role", e.target.value)} />
            <textarea className="h-24 rounded-xl border border-gray-200 p-3 sm:col-span-3" placeholder="Short bio" value={data.bio} onChange={(e) => setField("bio", e.target.value)} />
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={sectionClass}>
          <p className="mb-2 text-sm font-semibold text-gray-900">Goals</p>
          <textarea className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3" value={data.goals} onChange={(e) => setField("goals", e.target.value)} />
        </div>
        <div className={sectionClass}>
          <p className="mb-2 text-sm font-semibold text-gray-900">Pain Points</p>
          <textarea className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3" value={data.painPoints} onChange={(e) => setField("painPoints", e.target.value)} />
        </div>
        <div className={sectionClass}>
          <p className="mb-2 text-sm font-semibold text-gray-900">Behaviors</p>
          <textarea className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3" value={data.behaviors} onChange={(e) => setField("behaviors", e.target.value)} />
        </div>
        <div className={sectionClass}>
          <p className="mb-2 text-sm font-semibold text-gray-900">Needs</p>
          <textarea className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3" value={data.needs} onChange={(e) => setField("needs", e.target.value)} />
        </div>
        <div className="rounded-2xl bg-gray-50 p-5 md:col-span-2 xl:col-span-2">
          <p className="mb-2 text-sm font-semibold text-gray-900">Motivations</p>
          <textarea className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3" value={data.motivations} onChange={(e) => setField("motivations", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" disabled={isPending} onClick={save} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200">
          {isPending ? "저장 중..." : "Persona 저장"}
        </button>
      </div>
    </section>
  );
}
