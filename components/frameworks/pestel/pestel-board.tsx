"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { PestelFactorSection } from "./pestel-factor-section";
import { updatePestelItemsOrderAction } from "@/features/pestel/actions/pestel-actions";
import type { PestelItem, PestelFactor } from "@/features/pestel/types/pestel-item";
import type { Profile } from "@/features/profiles/types/profile";

type PestelBoardProps = {
  projectId: string;
  projectFrameworkId: string | null;
  currentVersion: number | null;
  canCreate: boolean;
  items: PestelItem[];
  profiles: Profile[];
};

type FactorConfig = {
  factor: PestelFactor;
  label: string;
  description: string;
  color: string;
};

const factors: FactorConfig[] = [
  { factor: "POLITICAL",     label: "Political",     description: "정치·규제·정책 환경이 사업에 미치는 영향",        color: "#3B82F6" },
  { factor: "ECONOMIC",      label: "Economic",      description: "경제 지표·금리·환율·소비 트렌드 등",             color: "#10B981" },
  { factor: "SOCIAL",        label: "Social",        description: "인구통계·라이프스타일·문화적 변화",               color: "#F59E0B" },
  { factor: "TECHNOLOGICAL", label: "Technological", description: "기술 혁신·자동화·R&D 트렌드",                    color: "#8B5CF6" },
  { factor: "ENVIRONMENTAL", label: "Environmental", description: "기후·환경 규제·지속가능성 이슈",                  color: "#06B6D4" },
  { factor: "LEGAL",         label: "Legal",         description: "법률·개인정보·지식재산권·노동법 관련 사항",       color: "#EF4444" },
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

function getFactorId(factor: PestelFactor): string {
  return `factor:${factor}`;
}

function parseFactorId(id: string): PestelFactor | null {
  if (!id.startsWith("factor:")) {
    return null;
  }

  const factor = id.replace("factor:", "");
  if (
    factor === "POLITICAL" ||
    factor === "ECONOMIC" ||
    factor === "SOCIAL" ||
    factor === "TECHNOLOGICAL" ||
    factor === "ENVIRONMENTAL" ||
    factor === "LEGAL"
  ) {
    return factor;
  }

  return null;
}

function toFlatItems(grouped: Record<PestelFactor, PestelItem[]>): PestelItem[] {
  return [
    ...grouped.POLITICAL,
    ...grouped.ECONOMIC,
    ...grouped.SOCIAL,
    ...grouped.TECHNOLOGICAL,
    ...grouped.ENVIRONMENTAL,
    ...grouped.LEGAL,
  ];
}

function toPestelOrderPayload(grouped: Record<PestelFactor, PestelItem[]>) {
  return (Object.entries(grouped) as Array<[PestelFactor, PestelItem[]]>).flatMap(([factor, list]) =>
    list.map((item, index) => ({ id: item.id, factor, position: index })),
  );
}

export function PestelBoard({ projectId, projectFrameworkId, currentVersion, canCreate, items, profiles }: PestelBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [boardItems, setBoardItems] = useState<PestelItem[]>(items);

  useEffect(() => {
    setBoardItems(items);
  }, [items]);

  const groupedItems = useMemo(() => groupItems(boardItems), [boardItems]);

  const itemFactorMap = useMemo(() => {
    const map = new Map<string, PestelFactor>();
    for (const item of boardItems) {
      map.set(item.id, item.factor);
    }
    return map;
  }, [boardItems]);

  const profileById = useMemo(() => {
    const map = new Map<string, { name: string; avatarColor: string }>();
    for (const profile of profiles) {
      map.set(profile.id, { name: profile.name, avatarColor: profile.avatarColor });
    }
    return map;
  }, [profiles]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    const sourceFactor = itemFactorMap.get(activeId);
    if (!sourceFactor) {
      return;
    }

    const targetFactor = parseFactorId(overId) ?? itemFactorMap.get(overId);
    if (!targetFactor) {
      return;
    }

    const currentGrouped = groupItems(boardItems);
    const sourceItems = [...currentGrouped[sourceFactor]];
    const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);

    if (sourceIndex < 0) {
      return;
    }

    const draggedItem = sourceItems[sourceIndex];
    const previousBoardItems = boardItems;

    if (sourceFactor === targetFactor) {
      const targetIndex = sourceItems.findIndex((item) => item.id === overId);
      if (targetIndex < 0) {
        return;
      }

      currentGrouped[sourceFactor] = arrayMove(sourceItems, sourceIndex, targetIndex);
    } else {
      const nextSourceItems = sourceItems.filter((item) => item.id !== activeId);
      const targetItems = [...currentGrouped[targetFactor]];
      const targetIndex = targetItems.findIndex((item) => item.id === overId);

      const movedItem: PestelItem = {
        ...draggedItem,
        factor: targetFactor,
      };

      if (targetIndex >= 0) {
        targetItems.splice(targetIndex, 0, movedItem);
      } else {
        targetItems.push(movedItem);
      }

      currentGrouped[sourceFactor] = nextSourceItems;
      currentGrouped[targetFactor] = targetItems;
    }

    const nextBoardItems = toFlatItems(currentGrouped).map((item, index) => ({ ...item, position: index }));
    setBoardItems(nextBoardItems);

    const payload = toPestelOrderPayload(currentGrouped);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("updates", JSON.stringify(payload));
        await updatePestelItemsOrderAction(formData);
      } catch (error) {
        console.error("Failed to persist PESTEL drag move", error);
        setBoardItems(previousBoardItems);
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">PESTEL Board</h2>
          {currentVersion ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              v{currentVersion}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-base text-gray-700">
          6가지 외부 환경 요인을 분석해 전략적 기회와 위협을 파악하세요.
        </p>
        {isPending ? <p className="mt-2 text-sm text-gray-400">저장 중...</p> : null}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 lg:grid-cols-2">
          {factors.map((f) => (
            <PestelFactorSection
              key={f.factor}
              projectId={projectId}
              projectFrameworkId={projectFrameworkId}
              canCreate={canCreate}
              factor={f.factor}
              factorId={getFactorId(f.factor)}
              label={f.label}
              description={f.description}
              color={f.color}
              items={groupedItems[f.factor]}
              profileById={profileById}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}
