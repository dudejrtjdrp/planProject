"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFrameworkTitleAction } from "@/features/frameworks/actions/framework-actions";
import { pushToast } from "@/lib/utils/toast";

type ThreeCBlock = {
  headline: string;
  targetSegment: string;
  needs: string;
  painPoints: string;
  buyingBehavior: string;
};

type CompanyBlock = {
  headline: string;
  coreStrength: string;
  resources: string;
  differentiation: string;
  internalCapabilities: string;
};

type CompetitorBlock = {
  headline: string;
  keyPlayers: string;
  marketPosition: string;
  strengths: string;
  weaknesses: string;
};

type StrategicInsight = {
  alignmentOrMismatch: string;
  competitiveAdvantage: string;
  strategicDirection: string;
};

export type ThreeCData = {
  customer: ThreeCBlock;
  company: CompanyBlock;
  competitor: CompetitorBlock;
  strategicInsight: StrategicInsight;
};

type ThreeCAnalysisBoardProps = {
  projectId: string;
  frameworkId: string | null;
  currentVersion: number | null;
  initialData: ThreeCData;
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextField({ label, value, onChange }: TextFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function adjustHeight() {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          adjustHeight();
        }}
        rows={3}
        className="min-h-[96px] w-full overflow-hidden resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export function ThreeCAnalysisBoard({ projectId, frameworkId, currentVersion, initialData }: ThreeCAnalysisBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ThreeCData>(initialData);

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
        await updateFrameworkTitleAction(projectId, "COMPETITOR_MAPPING", validFrameworkId, JSON.stringify(data));
        pushToast("3C Analysis 내용이 저장되었습니다.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
        pushToast(message, "error");
      }
    });
  }

  return (
    <section className="relative space-y-8 rounded-3xl border border-gray-200 bg-gray-50 p-10 shadow-sm">
      {isPending ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-500">저장 중...</p>
        </div>
      ) : null}

      <div>
        <p className="text-sm text-gray-400">프레임워크 · 3C 분석</p>
        {currentVersion ? (
          <p className="mt-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              v{currentVersion}
            </span>
          </p>
        ) : null}
        <h2 className="mt-1 text-4xl font-bold tracking-tight text-gray-900">3C 분석</h2>
        <p className="mt-2 max-w-3xl text-base text-gray-600">
          고객, 자사, 경쟁사를 한 화면에서 비교해 전략적 정합성, 불일치 지점, 그리고 우선 공략 기회를 도출하세요.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-10 max-xl:grid-cols-1">
        <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-t-4 border-emerald-300 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Customer</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{data.customer.headline}</h3>
          </div>
          <div className="space-y-4">
            <TextField
              label="타깃 세그먼트"
              value={data.customer.targetSegment}
              onChange={(value) => setData((prev) => ({ ...prev, customer: { ...prev.customer, targetSegment: value } }))}
            />
            <TextField
              label="핵심 니즈"
              value={data.customer.needs}
              onChange={(value) => setData((prev) => ({ ...prev, customer: { ...prev.customer, needs: value } }))}
            />
            <TextField
              label="페인 포인트"
              value={data.customer.painPoints}
              onChange={(value) => setData((prev) => ({ ...prev, customer: { ...prev.customer, painPoints: value } }))}
            />
            <TextField
              label="구매 행동"
              value={data.customer.buyingBehavior}
              onChange={(value) => setData((prev) => ({ ...prev, customer: { ...prev.customer, buyingBehavior: value } }))}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-t-4 border-blue-300 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Company</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{data.company.headline}</h3>
          </div>
          <div className="space-y-4">
            <TextField
              label="핵심 강점"
              value={data.company.coreStrength}
              onChange={(value) => setData((prev) => ({ ...prev, company: { ...prev.company, coreStrength: value } }))}
            />
            <TextField
              label="보유 자원"
              value={data.company.resources}
              onChange={(value) => setData((prev) => ({ ...prev, company: { ...prev.company, resources: value } }))}
            />
            <TextField
              label="차별화 요소"
              value={data.company.differentiation}
              onChange={(value) => setData((prev) => ({ ...prev, company: { ...prev.company, differentiation: value } }))}
            />
            <TextField
              label="내부 역량"
              value={data.company.internalCapabilities}
              onChange={(value) => setData((prev) => ({ ...prev, company: { ...prev.company, internalCapabilities: value } }))}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 border-t-4 border-rose-300 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Competitor</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{data.competitor.headline}</h3>
          </div>
          <div className="space-y-4">
            <TextField
              label="주요 경쟁사"
              value={data.competitor.keyPlayers}
              onChange={(value) => setData((prev) => ({ ...prev, competitor: { ...prev.competitor, keyPlayers: value } }))}
            />
            <TextField
              label="시장 포지셔닝"
              value={data.competitor.marketPosition}
              onChange={(value) => setData((prev) => ({ ...prev, competitor: { ...prev.competitor, marketPosition: value } }))}
            />
            <TextField
              label="강점"
              value={data.competitor.strengths}
              onChange={(value) => setData((prev) => ({ ...prev, competitor: { ...prev.competitor, strengths: value } }))}
            />
            <TextField
              label="약점"
              value={data.competitor.weaknesses}
              onChange={(value) => setData((prev) => ({ ...prev, competitor: { ...prev.competitor, weaknesses: value } }))}
            />
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-blue-200 bg-blue-50 p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Strategic Insight</p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-900">전략 인사이트 요약</h3>
        <div className="mt-6 grid items-start gap-4 md:grid-cols-3">
          <TextField
            label="정렬 / 불일치"
            value={data.strategicInsight.alignmentOrMismatch}
            onChange={(value) =>
              setData((prev) => ({
                ...prev,
                strategicInsight: { ...prev.strategicInsight, alignmentOrMismatch: value },
              }))
            }
          />
          <TextField
            label="경쟁 우위"
            value={data.strategicInsight.competitiveAdvantage}
            onChange={(value) =>
              setData((prev) => ({
                ...prev,
                strategicInsight: { ...prev.strategicInsight, competitiveAdvantage: value },
              }))
            }
          />
          <TextField
            label="전략 방향"
            value={data.strategicInsight.strategicDirection}
            onChange={(value) =>
              setData((prev) => ({
                ...prev,
                strategicInsight: { ...prev.strategicInsight, strategicDirection: value },
              }))
            }
          />
        </div>
      </article>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={save}
          className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200"
        >
          {isPending ? "저장 중..." : "3C 저장"}
        </button>
      </div>
    </section>
  );
}
