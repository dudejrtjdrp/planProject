"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";

type Version = { version: number };

type ReportVersionSelectorProps = {
  label: string;
  paramKey: string;
  currentVersion: number | null;
  versions: Version[];
};

export function ReportVersionSelector({ label, paramKey, currentVersion, versions }: ReportVersionSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isNavigating && pendingQuery === searchParams.toString()) {
      setIsNavigating(false);
      setPendingQuery(null);
    }
  }, [isNavigating, pendingQuery, searchParams]);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }
    const nextQuery = params.toString();
    setPendingQuery(nextQuery);
    setIsNavigating(true);
    startTransition(() => {
      router.push(`?${nextQuery}`);
    });
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      {isNavigating || isPending ? <FormPendingOverlay visible message="리포트 버전 데이터를 불러오는 중..." /> : null}
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={currentVersion ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isNavigating || isPending}
        className="rounded-lg border border-gray-200 bg-white py-1 pl-2 pr-6 text-xs text-gray-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
      >
        <option value="">Latest</option>
        {versions.map((v) => (
          <option key={v.version} value={v.version}>
            v{v.version}
          </option>
        ))}
      </select>
    </div>
  );
}
