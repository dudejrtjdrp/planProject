"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SwotCreateForm } from "./swot-create-form";
import { SwotItemCard } from "./swot-item-card";
import type { SwotItem, SwotType } from "@/features/swot/types/swot-item";

type SwotQuadrantProps = {
  projectId: string;
  projectFrameworkId: string | null;
  type: SwotType;
  title: string;
  description: string;
  items: SwotItem[];
  quadrantId: string;
  profileById: Map<string, { name: string; avatarColor: string }>;
};

export function SwotQuadrant({
  projectId,
  projectFrameworkId,
  type,
  title,
  description,
  items,
  quadrantId,
  profileById,
}: SwotQuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: quadrantId,
    data: {
      quadrantType: type,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 print:shadow-none print:p-4 print:break-inside-avoid ${
        isOver ? "border-[#3182F6] ring-2 ring-blue-100" : "border-gray-200 print:border-gray-300"
      }`}
    >
      <header className="mb-5 space-y-1 print:mb-3 print:space-y-0.5">
        <h3 className="text-xl font-semibold text-gray-900 print:text-lg">{title}</h3>
        <p className="text-sm text-gray-400 print:text-xs">{description}</p>
      </header>

      <SwotCreateForm
        projectId={projectId}
        projectFrameworkId={projectFrameworkId}
        type={type}
        placeholder={`${title} \uc544\uc774\ud15c\uc744 \uc785\ub825\ud558\uc138\uc694`}
      />

      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-5 space-y-3 print:mt-3 print:space-y-2">
          {items.length ? (
            items.map((item) => (
              <SwotItemCard key={item.id} item={item} projectId={projectId} profileById={profileById} />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400 print:hidden\">
              \uc544\uc9c1 {title.toLowerCase()} \uc544\uc774\ud15c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
