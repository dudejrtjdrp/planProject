"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SwotQuadrant } from "./swot-quadrant";
import { useSwotRealtime } from "./swot-realtime-hook";
import type { Profile } from "@/features/profiles/types/profile";
import { updateSwotItemType } from "@/features/swot/actions/swot-actions";
import { fromSwotDbQuadrant, parseSwotContent, type SwotItem, type SwotType } from "@/features/swot/types/swot-item";

type SwotBoardProps = {
  projectId: string;
  projectFrameworkId: string | null;
  currentVersion: number | null;
  items: SwotItem[];
  profiles: Profile[];
};

type QuadrantConfig = {
  type: SwotType;
  title: string;
  description: string;
};

const quadrants: QuadrantConfig[] = [
  { type: "STRENGTH", title: "Strength", description: "내부 강점과 경쟁 우위를 정리합니다." },
  { type: "WEAKNESS", title: "Weakness", description: "내부 약점과 개선 필요 영역을 정리합니다." },
  { type: "OPPORTUNITY", title: "Opportunity", description: "외부 기회와 성장 요인을 정리합니다." },
  { type: "THREAT", title: "Threat", description: "외부 위협과 리스크 요인을 정리합니다." },
];

function getQuadrantId(type: SwotType): string {
  return `quadrant:${type}`;
}

function parseQuadrantId(id: string): SwotType | null {
  if (!id.startsWith("quadrant:")) {
    return null;
  }

  const type = id.replace("quadrant:", "");
  if (type === "STRENGTH" || type === "WEAKNESS" || type === "OPPORTUNITY" || type === "THREAT") {
    return type;
  }

  return null;
}

function toGroupedItems(items: SwotItem[]): Record<SwotType, SwotItem[]> {
  const grouped: Record<SwotType, SwotItem[]> = {
    STRENGTH: [],
    WEAKNESS: [],
    OPPORTUNITY: [],
    THREAT: [],
  };

  for (const item of items) {
    grouped[item.type].push(item);
  }

  return grouped;
}

function toFlatItems(grouped: Record<SwotType, SwotItem[]>): SwotItem[] {
  return [...grouped.STRENGTH, ...grouped.WEAKNESS, ...grouped.OPPORTUNITY, ...grouped.THREAT];
}

export function SwotBoard({ projectId, projectFrameworkId, currentVersion, items, profiles }: SwotBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [boardItems, setBoardItems] = useState<SwotItem[]>(items);
  const pendingMutationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setBoardItems(items);
  }, [items]);

  const groupedItems = useMemo(() => toGroupedItems(boardItems), [boardItems]);

  const itemTypeMap = useMemo(() => {
    const map = new Map<string, SwotType>();
    for (const item of boardItems) {
      map.set(item.id, item.type);
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

  useSwotRealtime({
    projectFrameworkId,
    onInsert: useCallback((row) => {
      const parsed = parseSwotContent(row.content);
      const insertedItem: SwotItem = {
        id: row.id,
        projectFrameworkId: row.project_framework_id,
        createdBy: row.created_by,
        type: fromSwotDbQuadrant(row.quadrant),
        title: parsed.title,
        description: parsed.description,
        content: row.content,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      setBoardItems((prev) => {
        if (prev.some((item) => item.id === insertedItem.id)) {
          return prev;
        }
        return [...prev, insertedItem];
      });
    }, []),
    onUpdate: useCallback((row) => {
      if (pendingMutationIdsRef.current.has(row.id)) {
        pendingMutationIdsRef.current.delete(row.id);
        return;
      }

      const parsed = parseSwotContent(row.content);
      const updatedItem: SwotItem = {
        id: row.id,
        projectFrameworkId: row.project_framework_id,
        createdBy: row.created_by,
        type: fromSwotDbQuadrant(row.quadrant),
        title: parsed.title,
        description: parsed.description,
        content: row.content,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      setBoardItems((prev) => {
        let found = false;
        const next = prev.map((item) => {
          if (item.id !== updatedItem.id) {
            return item;
          }
          found = true;
          return { ...item, ...updatedItem };
        });

        return found ? next : [...prev, updatedItem];
      });
    }, []),
    onDelete: useCallback((row) => {
      pendingMutationIdsRef.current.delete(row.id);
      setBoardItems((prev) => prev.filter((item) => item.id !== row.id));
    }, []),
  });

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

    const sourceType = itemTypeMap.get(activeId);
    if (!sourceType) {
      return;
    }

    const targetType = parseQuadrantId(overId) ?? itemTypeMap.get(overId);
    if (!targetType) {
      return;
    }

    const currentGrouped = toGroupedItems(boardItems);
    const sourceItems = [...currentGrouped[sourceType]];
    const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);

    if (sourceIndex < 0) {
      return;
    }

    const draggedItem = sourceItems[sourceIndex];

    if (sourceType === targetType) {
      const targetIndex = sourceItems.findIndex((item) => item.id === overId);
      if (targetIndex < 0) {
        return;
      }

      currentGrouped[sourceType] = arrayMove(sourceItems, sourceIndex, targetIndex);
      setBoardItems(toFlatItems(currentGrouped));
      return;
    }

    const nextSourceItems = sourceItems.filter((item) => item.id !== activeId);
    const targetItems = [...currentGrouped[targetType]];
    const targetIndex = targetItems.findIndex((item) => item.id === overId);

    const movedItem: SwotItem = {
      ...draggedItem,
      type: targetType,
    };

    if (targetIndex >= 0) {
      targetItems.splice(targetIndex, 0, movedItem);
    } else {
      targetItems.push(movedItem);
    }

    currentGrouped[sourceType] = nextSourceItems;
    currentGrouped[targetType] = targetItems;

    setBoardItems(toFlatItems(currentGrouped));
    pendingMutationIdsRef.current.add(activeId);

    startTransition(async () => {
      try {
        await updateSwotItemType(activeId, targetType);
      } catch (error) {
        console.error("Failed to persist SWOT drag move", error);
        pendingMutationIdsRef.current.delete(activeId);
      }
    });
  }

  return (
    <section className="space-y-6 print:space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm print:shadow-none print:p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900 print:text-lg">SWOT Board</h2>
          {currentVersion ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              v{currentVersion}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-base text-gray-700 print:text-sm">핵심 전략 인사이트를 4개 축으로 빠르게 정리하세요.</p>
        {isPending ? <p className="mt-2 text-sm text-gray-400 print:hidden">저장 중...</p> : null}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-1 print:gap-4">
          {quadrants.map((quadrant) => (
            <SwotQuadrant
              key={quadrant.type}
              projectId={projectId}
              projectFrameworkId={projectFrameworkId}
              type={quadrant.type}
              title={quadrant.title}
              description={quadrant.description}
              items={groupedItems[quadrant.type]}
              quadrantId={getQuadrantId(quadrant.type)}
              profileById={profileById}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}
