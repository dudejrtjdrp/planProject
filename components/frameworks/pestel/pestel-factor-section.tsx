import { PestelCreateForm } from "./pestel-create-form";
import { PestelItemCard } from "./pestel-item-card";
import type { PestelItem, PestelFactor } from "@/features/pestel/types/pestel-item";

type PestelFactorSectionProps = {
  projectId: string;
  projectFrameworkId: string | null;
  factor: PestelFactor;
  factorId?: string;
  label: string;
  description: string;
  color: string;
  items: PestelItem[];
  profileById: Map<string, { name: string; avatarColor: string }>;
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
}: PestelFactorSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
    </section>
  );
}
