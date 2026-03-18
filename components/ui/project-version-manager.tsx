"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { pushToast } from "@/lib/utils/toast";
import { createProjectVersionAction } from "@/features/projects/actions/project-version-actions";
import type { ProjectVersion } from "@/features/projects/data/project-repository";

type ProjectVersionManagerProps = {
  projectId: string;
  currentVersion: number | null;
  versions: ProjectVersion[];
};

export function ProjectVersionManager({ projectId, currentVersion, versions }: ProjectVersionManagerProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pendingVersionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    if (pendingVersionRef.current === null || currentVersion === pendingVersionRef.current) {
      setIsNavigating(false);
      pendingVersionRef.current = null;
    }
  }, [currentVersion, isNavigating]);

  function goVersion(version: number) {
    if (currentVersion === version) {
      setIsNavigating(false);
      pendingVersionRef.current = null;
      return;
    }

    pendingVersionRef.current = version;
    setIsNavigating(true);
    startTransition(() => {
      router.push(`/project/${projectId}?pv=${version}`);
    });
  }

  function handleCreateVersion() {
    startTransition(async () => {
      try {
        const result = await createProjectVersionAction(projectId);
        pushToast(`프로젝트 v${result.version} 스냅샷 생성 완료`);
        pendingVersionRef.current = result.version;
        setIsNavigating(true);
        router.push(`/project/${projectId}?pv=${result.version}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "프로젝트 버전 생성에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {isNavigating || isPending ? <FormPendingOverlay visible message="버전 데이터를 불러오는 중..." /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm font-medium text-gray-600">프로젝트 버전</p>
        {versions.map((versionItem) => {
          const active = currentVersion === versionItem.version;
          return (
            <button
              key={versionItem.id}
              type="button"
              onClick={() => goVersion(versionItem.version)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                active
                  ? "border-[#3182F6] bg-blue-50 text-[#3182F6]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              v{versionItem.version}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleCreateVersion}
          disabled={isPending}
          className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          {isPending ? "생성 중..." : "+ 스냅샷"}
        </button>
      </div>
    </div>
  );
}
