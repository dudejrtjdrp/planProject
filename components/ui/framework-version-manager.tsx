"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { pushToast } from "@/lib/utils/toast";
import { createFrameworkVersionAction } from "@/features/frameworks/actions/framework-actions";
import type { FrameworkKey, ProjectFramework } from "@/features/frameworks/types/framework";

type FrameworkVersionManagerProps = {
  projectId: string;
  frameworkKey: FrameworkKey;
  basePath: string;
  projectVersion: number | null;
  hasProjectVersion: boolean;
  currentFrameworkId: string | null;
  currentVersion: number | null;
  versions: ProjectFramework[];
};

export function FrameworkVersionManager({
  projectId,
  frameworkKey,
  basePath,
  projectVersion,
  hasProjectVersion,
  currentFrameworkId,
  currentVersion,
  versions,
}: FrameworkVersionManagerProps) {
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
    pendingVersionRef.current = version;
    setIsNavigating(true);
    const query = new URLSearchParams({ fv: String(version) });
    if (projectVersion) {
      query.set("pv", String(projectVersion));
    }

    startTransition(() => {
      router.push(`${basePath}?${query.toString()}`);
    });
  }

  function handleCreateVersion() {
    if (!hasProjectVersion) {
      pushToast("프로젝트 버전이 없어 새 분석 버전을 만들 수 없습니다.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createFrameworkVersionAction(projectId, frameworkKey, currentFrameworkId);
        pushToast(`${frameworkKey} v${result.version} 생성 완료`);
        pendingVersionRef.current = result.version;
        setIsNavigating(true);
        const query = new URLSearchParams({ fv: String(result.version) });
        if (projectVersion) {
          query.set("pv", String(projectVersion));
        }
        router.push(`${basePath}?${query.toString()}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "버전 생성에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {isNavigating || isPending ? <FormPendingOverlay visible message="버전 데이터를 불러오는 중..." /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm font-medium text-gray-600">버전</p>
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
          disabled={isPending || !hasProjectVersion}
          className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          {isPending ? "생성 중..." : "+ 새 버전"}
        </button>
      </div>
      {!hasProjectVersion ? (
        <p className="mt-3 text-xs text-amber-600">프로젝트 버전이 없어 생성할 수 없습니다. 프로젝트에서 버전을 먼저 생성해 주세요.</p>
      ) : null}
    </div>
  );
}
