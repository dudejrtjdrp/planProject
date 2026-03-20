import { redirect } from "next/navigation";
import { ThreeCAnalysisBoard, type ThreeCData } from "@/components/frameworks/three-c/three-c-analysis-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import {
  getFrameworkByKey,
  getFrameworkByVersion,
  getFrameworkVersionsByKey,
} from "@/features/frameworks/data/framework-repository";
import { getProjectById, getProjectVersions } from "@/features/projects/data/project-repository";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ fv?: string; pv?: string }>;
};

function getDefaultData(): ThreeCData {
  return {
    customer: {
      headline: "고객 관점",
      targetSegment: "핵심 타깃 고객군과 구매자 유형",
      needs: "고객이 기대하는 핵심 성과와 가치",
      painPoints: "현재 여정에서 겪는 주요 불편과 장애",
      buyingBehavior: "의사결정 흐름, 구매 시점, 채널 특성",
    },
    company: {
      headline: "자사 관점",
      coreStrength: "경쟁사 대비 더 잘 수행하는 핵심 역량",
      resources: "인력, 자본, 기술, 파트너십 등 보유 자원",
      differentiation: "명확한 가치제안과 차별화 포인트",
      internalCapabilities: "지속적으로 우위 확보에 필요한 내부 역량",
    },
    competitor: {
      headline: "경쟁사 관점",
      keyPlayers: "직접 경쟁사와 인접 대체 플레이어",
      marketPosition: "가격대, 브랜드, 채널 기준 시장 위치",
      strengths: "경쟁사가 탁월하게 수행하는 요소",
      weaknesses: "경쟁사가 취약하거나 과도 확장한 지점",
    },
    strategicInsight: {
      alignmentOrMismatch: "고객 요구와 자사 역량이 정렬/불일치하는 핵심 지점",
      competitiveAdvantage: "주요 경쟁사 대비 방어 가능한 핵심 우위",
      strategicDirection: "다음 계획 주기에서 가장 중요한 전략적 실행 방향",
    },
  };
}

function parseData(raw: string | null): ThreeCData {
  if (!raw) {
    return getDefaultData();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ThreeCData>;
    const defaults = getDefaultData();

    return {
      customer: {
        ...defaults.customer,
        ...(parsed.customer ?? {}),
      },
      company: {
        ...defaults.company,
        ...(parsed.company ?? {}),
      },
      competitor: {
        ...defaults.competitor,
        ...(parsed.competitor ?? {}),
      },
      strategicInsight: {
        ...defaults.strategicInsight,
        ...(parsed.strategicInsight ?? {}),
      },
    };
  } catch {
    return getDefaultData();
  }
}

export default async function ProjectThreeCAnalysisPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

  const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
  const hasProjectVersion = projectVersions.length > 0;
  if (!project) {
    redirect("/projects");
  }

  const frameworkVersions = await getFrameworkVersionsByKey(id, "COMPETITOR_MAPPING");
  const framework = Number.isFinite(selectedVersion)
    ? await getFrameworkByVersion(id, "COMPETITOR_MAPPING", selectedVersion)
    : await getFrameworkByKey(id, "COMPETITOR_MAPPING");

  if (!Number.isFinite(selectedVersion) && framework) {
    const query = new URLSearchParams({ fv: String(framework.version) });
    if (Number.isFinite(selectedProjectVersion)) {
      query.set("pv", String(selectedProjectVersion));
    }
    redirect(`/project/${id}/3c-analysis?${query.toString()}`);
  }

  if (Number.isFinite(selectedVersion) && !framework) {
    const fallbackVersion = frameworkVersions[0]?.version;
    if (fallbackVersion) {
      const query = new URLSearchParams({ fv: String(fallbackVersion) });
      if (Number.isFinite(selectedProjectVersion)) {
        query.set("pv", String(selectedProjectVersion));
      }
      redirect(`/project/${id}/3c-analysis?${query.toString()}`);
    }

    redirect(
      Number.isFinite(selectedProjectVersion)
        ? `/project/${id}/3c-analysis?pv=${selectedProjectVersion}`
        : `/project/${id}/3c-analysis`,
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <BackStepButton
          fallbackHref={Number.isFinite(selectedProjectVersion) ? `/project/${id}?pv=${selectedProjectVersion}` : `/project/${id}`}
          label="프로젝트 홈으로"
        />
        <p className="text-sm text-gray-400">프레임워크 · 3C 분석</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
      </header>

      <FrameworkVersionManager
        projectId={id}
        frameworkKey="COMPETITOR_MAPPING"
        basePath={`/project/${id}/3c-analysis`}
        projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
        hasProjectVersion={hasProjectVersion}
        currentFrameworkId={framework?.id ?? null}
        currentVersion={framework?.version ?? null}
        versions={frameworkVersions}
      />

      <ThreeCAnalysisBoard
        key={framework?.id ?? "three-c-empty"}
        projectId={id}
        frameworkId={framework?.id ?? null}
        currentVersion={framework?.version ?? null}
        initialData={parseData(framework?.title ?? null)}
      />
    </div>
  );
}
