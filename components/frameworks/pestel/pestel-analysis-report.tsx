"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  createPestelItemAction,
  deletePestelItemAction,
  updatePestelItemContentAction,
} from "@/features/pestel/actions/pestel-actions";
import { usePestelRealtime } from "./pestel-realtime-hook";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";
import type { PestelItem, PestelFactor } from "@/features/pestel/types/pestel-item";
import type { Profile } from "@/features/profiles/types/profile";

type PestelAnalysisReportProps = {
  projectId: string;
  projectFrameworkId: string | null;
  items: PestelItem[];
  profiles: Profile[];
};

type FactorConfig = {
  factor: PestelFactor;
  label: string;
  description: string;
  indicatorColor: string;
  indicatorBg: string;
  bgAccent: string;
  borderColor: string;
};

const factors: FactorConfig[] = [
  {
    factor: "POLITICAL",
    label: "Political",
    description: "정치·규제·정책 환경",
    indicatorColor: "before:bg-blue-500",
    indicatorBg: "bg-blue-50",
    bgAccent: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    factor: "ECONOMIC",
    label: "Economic",
    description: "경제 지표·금리·환율",
    indicatorColor: "before:bg-emerald-500",
    indicatorBg: "bg-emerald-50",
    bgAccent: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  {
    factor: "SOCIAL",
    label: "Social",
    description: "인구통계·라이프스타일",
    indicatorColor: "before:bg-amber-500",
    indicatorBg: "bg-amber-50",
    bgAccent: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    factor: "TECHNOLOGICAL",
    label: "Technological",
    description: "기술 혁신·자동화·R&D",
    indicatorColor: "before:bg-purple-500",
    indicatorBg: "bg-purple-50",
    bgAccent: "bg-purple-50",
    borderColor: "border-purple-100",
  },
  {
    factor: "ENVIRONMENTAL",
    label: "Environmental",
    description: "기후·환경 규제·지속가능성",
    indicatorColor: "before:bg-cyan-500",
    indicatorBg: "bg-cyan-50",
    bgAccent: "bg-cyan-50",
    borderColor: "border-cyan-100",
  },
  {
    factor: "LEGAL",
    label: "Legal",
    description: "법률·지식재산권·노동법",
    indicatorColor: "before:bg-red-500",
    indicatorBg: "bg-red-50",
    bgAccent: "bg-red-50",
    borderColor: "border-red-100",
  },
];

function groupItems(items: PestelItem[]): Record<PestelFactor, PestelItem[]> {
  const grouped = {
    POLITICAL: [],
    ECONOMIC: [],
    SOCIAL: [],
    TECHNOLOGICAL: [],
    ENVIRONMENTAL: [],
    LEGAL: [],
  } as Record<PestelFactor, PestelItem[]>;

  for (const item of items) {
    grouped[item.factor].push(item);
  }

  return grouped;
}

export function PestelAnalysisReport({ projectId, projectFrameworkId, items, profiles }: PestelAnalysisReportProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [boardItems, setBoardItems] = useState<PestelItem[]>(items);
  const [createFactor, setCreateFactor] = useState<PestelFactor | null>(null);
  const [createDraft, setCreateDraft] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  useEffect(() => {
    setBoardItems(items);
  }, [items]);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setCurrentUserName(saved);
  }, []);

  usePestelRealtime({
    projectFrameworkId,
    onInsert: (row) => {
      setBoardItems((prev) => [
        ...prev,
        {
          id: row.id,
          factor: row.factor,
          content: row.content,
          position: row.position ?? 0,
          createdBy: row.created_by,
          projectFrameworkId: row.project_framework_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      ]);
    },
    onUpdate: (row) => {
      setBoardItems((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                content: row.content,
                updatedAt: row.updated_at,
              }
            : item
        )
      );
    },
    onDelete: (row) => {
      setBoardItems((prev) => prev.filter((item) => item.id !== row.id));
    },
  });

  const groupedItems = useMemo(() => groupItems(boardItems), [boardItems]);

  const profileById = useMemo(() => {
    const map = new Map<string, { name: string; avatarColor: string }>();
    for (const profile of profiles) {
      map.set(profile.id, { name: profile.name, avatarColor: profile.avatarColor });
    }
    return map;
  }, [profiles]);

  const fallbackUser = profiles[0]?.name ?? "";
  const selectedUser = currentUserName || fallbackUser;

  function handleCreate(factor: PestelFactor) {
    const content = createDraft.trim();
    if (!content) {
      pushToast("내용을 입력해 주세요.", "error");
      return;
    }
    if (!selectedUser) {
      pushToast("프로필을 먼저 선택해 주세요.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("projectFrameworkId", projectFrameworkId ?? "");
        formData.set("factor", factor);
        formData.set("content", content);
        formData.set("createdBy", selectedUser);
        await createPestelItemAction(formData);
        setCreateDraft("");
        setCreateFactor(null);
        pushToast("PESTEL 항목이 추가되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "PESTEL 항목 추가에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  function startEdit(item: PestelItem) {
    setEditingItemId(item.id);
    setEditingDraft(item.content);
  }

  function handleUpdate(itemId: string) {
    const content = editingDraft.trim();
    if (!content) {
      pushToast("수정 내용을 입력해 주세요.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("itemId", itemId);
        formData.set("content", content);
        await updatePestelItemContentAction(formData);
        setEditingItemId(null);
        setEditingDraft("");
        pushToast("PESTEL 항목이 수정되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "PESTEL 항목 수정에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  function handleDelete(itemId: string) {
    const confirmed = window.confirm("이 PESTEL 항목을 삭제할까요?");
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("itemId", itemId);
        await deletePestelItemAction(formData);
        pushToast("PESTEL 항목이 삭제되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "PESTEL 항목 삭제에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">PESTEL Analysis</h1>
        <p className="text-lg text-gray-500">
          Comprehensive macro-environment analysis framework covering political, economic, social, technological, environmental, and legal factors
        </p>
        {isPending ? <p className="text-sm text-gray-400">저장 중...</p> : null}
      </div>

      {/* Vertical Analytical Sections */}
      <div className="space-y-6">
        {factors.map((factorConfig) => {
          const factorItems = groupedItems[factorConfig.factor];

          return (
            <div
              key={factorConfig.factor}
              className={`relative rounded-3xl border ${factorConfig.borderColor} ${factorConfig.bgAccent} p-8 shadow-sm transition-all hover:shadow-md before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-3xl ${factorConfig.indicatorColor}`}
            >
              {/* Content grid: 250px title | 1fr analysis */}
              <div className="grid gap-10" style={{ gridTemplateColumns: "250px 1fr" }}>
                {/* Left: Category title & summary */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">{factorConfig.label}</h2>
                    <p className="text-sm text-gray-600">{factorConfig.description}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {factorItems.length} factor{factorItems.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Right: Detailed analysis */}
                <div className="space-y-4">
                  {createFactor === factorConfig.factor ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
                      <textarea
                        value={createDraft}
                        onChange={(event) => setCreateDraft(event.target.value)}
                        rows={3}
                        placeholder="분석 내용을 입력하세요"
                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreate(factorConfig.factor)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" /> 저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateFactor(null);
                            setCreateDraft("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <X className="h-3.5 w-3.5" /> 취소
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {factorItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                      <p className="text-sm text-gray-400">아직 입력된 요소가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {factorItems.map((item) => {
                        const profile = item.createdBy ? profileById.get(item.createdBy) : null;
                        const isEditing = editingItemId === item.id;

                        return (
                          <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
                            {isEditing ? (
                              <>
                                <textarea
                                  value={editingDraft}
                                  onChange={(event) => setEditingDraft(event.target.value)}
                                  rows={3}
                                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(item.id)}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                                  >
                                    <Check className="h-3.5 w-3.5" /> 저장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItemId(null);
                                      setEditingDraft("");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                                  >
                                    <X className="h-3.5 w-3.5" /> 취소
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-base font-medium text-gray-900">{item.content}</p>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                                    aria-label="PESTEL 항목 수정"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isPending}
                                    className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                                    aria-label="PESTEL 항목 삭제"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {profile && (
                              <div className="text-xs text-gray-500">
                                by <span className="font-medium text-gray-700">{profile.name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!createFactor ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCreateFactor(factorConfig.factor);
                        setCreateDraft("");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 w-full justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" /> 추가
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-12 rounded-3xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Total Factors</h3>
            <p className="text-sm text-gray-600">{boardItems.length} macro-environment factors analyzed</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Active Categories</h3>
            <p className="text-sm text-gray-600">{Object.values(groupedItems).filter((items) => items.length > 0).length} of 6 categories</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Analysis Status</h3>
            <p className="text-sm text-gray-600">
              {boardItems.length === 0 ? "No factors analyzed yet" : "Analysis in progress"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
