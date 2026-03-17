import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PestelCreateForm } from "./pestel-create-form";
import { PestelItemCard } from "./pestel-item-card";
import type { PestelItem, PestelFactor } from "@/features/pestel/types/pestel-item";

type PestelFactorSectionProps = {
  projectId: string;
  projectFrameworkId: string | null;
  factor: PestelFactor;
  label: string;
  description: string;
  color: string;
  items: PestelItem[];
  profileById: Map<string, { name: string; avatarColor: string }>;
  factorId: string;
};

export function PestelFactorSection({
  projectId,
  projectFrameworkId,
  factor,
  label,
  description,
  color,
  items,
  profileById,
  factorId,
}: PestelFactorSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: factorId,
    data: {
      factor,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 ${
        isOver ? "border-[#3182F6] ring-2 ring-blue-100" : "border-gray-200"
      }`}
    >
      <header className="mb-5 flex items-start gap-3">
        <span
          className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{label}</h3>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      </header>

      <PestelCreateForm
        projectId={projectId}
        projectFrameworkId={projectFrameworkId}
        factor={factor}
        placeholder={`${label} 요인을 입력하세요`}
      />

      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-5 space-y-3">
          {items.length ? (
            items.map((item) => (
              <PestelItemCard key={item.id} item={item} projectId={projectId} profileById={profileById} />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400">
              아직 {label} 항목이 없습니다.
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
