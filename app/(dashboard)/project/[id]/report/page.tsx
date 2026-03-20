import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getFrameworkByKey,
  getFrameworkByVersion,
  getFrameworkVersionsByKey,
} from "@/features/frameworks/data/framework-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById, getProjectVersion, getProjectVersions } from "@/features/projects/data/project-repository";
import { getPestelItemsByFrameworkId } from "@/features/pestel/data/pestel-repository";
import { getSwotItemsByFrameworkId } from "@/features/swot/data/swot-repository";
import { ReportVersionSelector } from "@/components/ui/report-version-selector";
import { PrintButton } from "@/components/ui/print-button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    pv?: string;
    swotV?: string;
    pestelV?: string;
    mck7sV?: string;
    matrixV?: string;
    personaV?: string;
    threeCV?: string;
  }>;
};

/* ---------- JSON helpers ---------- */
type SevenSData = {
  sharedValues: { title: string; description: string };
  strategy: { title: string; description: string };
  structure: { title: string; description: string };
  systems: { title: string; description: string };
  style: { title: string; description: string };
  staff: { title: string; description: string };
  skills: { title: string; description: string };
};
type MatrixData = { xAxis: string; yAxis: string; q1: string; q2: string; q3: string; q4: string };
type PersonaData = {
  name: string;
  age: string;
  role: string;
  bio: string;
  goals: string;
  painPoints: string;
  behaviors: string;
  needs: string;
  motivations: string;
  photoUrl?: string;
};

type ThreeCData = {
  customer: {
    headline: string;
    targetSegment: string;
    needs: string;
    painPoints: string;
    buyingBehavior: string;
  };
  company: {
    headline: string;
    coreStrength: string;
    resources: string;
    differentiation: string;
    internalCapabilities: string;
  };
  competitor: {
    headline: string;
    keyPlayers: string;
    marketPosition: string;
    strengths: string;
    weaknesses: string;
  };
  strategicInsight: {
    alignmentOrMismatch: string;
    competitiveAdvantage: string;
    strategicDirection: string;
  };
};

function parseSevenS(raw: string | null): SevenSData {
  const d: SevenSData = {
    sharedValues: { title: "", description: "" },
    strategy: { title: "", description: "" },
    structure: { title: "", description: "" },
    systems: { title: "", description: "" },
    style: { title: "", description: "" },
    staff: { title: "", description: "" },
    skills: { title: "", description: "" },
  };
  if (!raw) return d;
  try {
    const parsed = JSON.parse(raw) as Partial<SevenSData> & Record<string, unknown>;
    const normalize = (key: keyof SevenSData) => {
      const incoming = parsed[key] as unknown;
      if (typeof incoming === "string") {
        return { title: "", description: incoming };
      }
      if (incoming && typeof incoming === "object") {
        const node = incoming as { title?: string; description?: string };
        return {
          title: node.title ?? "",
          description: node.description ?? "",
        };
      }
      return d[key];
    };

    return {
      sharedValues: normalize("sharedValues"),
      strategy: normalize("strategy"),
      structure: normalize("structure"),
      systems: normalize("systems"),
      style: normalize("style"),
      staff: normalize("staff"),
      skills: normalize("skills"),
    };
  } catch {
    return d;
  }
}
function parseMatrix(raw: string | null): MatrixData {
  const d: MatrixData = { xAxis: "", yAxis: "", q1: "", q2: "", q3: "", q4: "" };
  if (!raw) return d;
  try { return { ...d, ...(JSON.parse(raw) as Partial<MatrixData>) }; } catch { return d; }
}
function parsePersona(raw: string | null): PersonaData {
  const d: PersonaData = { name: "", age: "", role: "", bio: "", goals: "", painPoints: "", behaviors: "", needs: "", motivations: "" };
  if (!raw) return d;
  try { return { ...d, ...(JSON.parse(raw) as Partial<PersonaData>) }; } catch { return d; }
}
function parseThreeC(raw: string | null): ThreeCData {
  const d: ThreeCData = {
    customer: {
      headline: "",
      targetSegment: "",
      needs: "",
      painPoints: "",
      buyingBehavior: "",
    },
    company: {
      headline: "",
      coreStrength: "",
      resources: "",
      differentiation: "",
      internalCapabilities: "",
    },
    competitor: {
      headline: "",
      keyPlayers: "",
      marketPosition: "",
      strengths: "",
      weaknesses: "",
    },
    strategicInsight: {
      alignmentOrMismatch: "",
      competitiveAdvantage: "",
      strategicDirection: "",
    },
  };

  if (!raw) return d;

  try {
    const parsed = JSON.parse(raw) as Partial<ThreeCData>;
    return {
      customer: { ...d.customer, ...(parsed.customer ?? {}) },
      company: { ...d.company, ...(parsed.company ?? {}) },
      competitor: { ...d.competitor, ...(parsed.competitor ?? {}) },
      strategicInsight: { ...d.strategicInsight, ...(parsed.strategicInsight ?? {}) },
    };
  } catch {
    return d;
  }
}

export default async function ProjectReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const selectedPv       = Number.parseInt(sp.pv       ?? "", 10);
  const selectedSwotV    = Number.parseInt(sp.swotV    ?? "", 10);
  const selectedPestelV  = Number.parseInt(sp.pestelV  ?? "", 10);
  const selectedMck7sV   = Number.parseInt(sp.mck7sV   ?? "", 10);
  const selectedMatrixV  = Number.parseInt(sp.matrixV  ?? "", 10);
  const selectedPersonaV = Number.parseInt(sp.personaV ?? "", 10);
  const selectedThreeCV  = Number.parseInt(sp.threeCV  ?? "", 10);

  const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
  if (!project) redirect("/projects");

  if (!Number.isFinite(selectedPv) && projectVersions.length > 0) {
    redirect(`/project/${id}/report?pv=${projectVersions[0].version}`);
  }

  let projectName = project!.name;
  let projectDescription = project!.description ?? "프로젝트 설명이 아직 없습니다.";

  if (Number.isFinite(selectedPv)) {
    const snap = await getProjectVersion(id, selectedPv);
    if (!snap && projectVersions.length > 0) redirect(`/project/${id}/report?pv=${projectVersions[0].version}`);
    if (snap) {
      projectName = snap.name;
      projectDescription = snap.description ?? projectDescription;
    }
  }

  const [swotVersions, pestelVersions, mck7sVersions, matrixVersions, personaVersions, threeCVersions, profiles] = await Promise.all([
    getFrameworkVersionsByKey(id, "SWOT"),
    getFrameworkVersionsByKey(id, "PESTEL"),
    getFrameworkVersionsByKey(id, "MCKINSEY_7S"),
    getFrameworkVersionsByKey(id, "MATRIX_2X2"),
    getFrameworkVersionsByKey(id, "PERSONA_MODEL"),
    getFrameworkVersionsByKey(id, "COMPETITOR_MAPPING"),
    getProfiles(),
  ]);

  type FwVersions = Awaited<ReturnType<typeof getFrameworkVersionsByKey>>;
  const resolveFw = (versions: FwVersions, key: Parameters<typeof getFrameworkByVersion>[1], v: number) =>
    Number.isFinite(v)
      ? getFrameworkByVersion(id, key, v)
      : versions.length > 0
        ? Promise.resolve(versions[0])
        : getFrameworkByKey(id, key);

  const [swotFw, pestelFw, mck7sFw, matrixFw, personaFw, threeCFw] = await Promise.all([
    resolveFw(swotVersions,    "SWOT",          selectedSwotV),
    resolveFw(pestelVersions,  "PESTEL",         selectedPestelV),
    resolveFw(mck7sVersions,   "MCKINSEY_7S",   selectedMck7sV),
    resolveFw(matrixVersions,  "MATRIX_2X2",    selectedMatrixV),
    resolveFw(personaVersions, "PERSONA_MODEL", selectedPersonaV),
    resolveFw(threeCVersions,  "COMPETITOR_MAPPING", selectedThreeCV),
  ]);

  const [swotItems, pestelItems] = await Promise.all([
    swotFw   ? getSwotItemsByFrameworkId(swotFw.id)     : Promise.resolve([]),
    pestelFw ? getPestelItemsByFrameworkId(pestelFw.id) : Promise.resolve([]),
  ]);

  const sevenSData  = parseSevenS(mck7sFw?.title   ?? null);
  const matrixData  = parseMatrix(matrixFw?.title   ?? null);
  const personaData = parsePersona(personaFw?.title ?? null);
  const threeCData  = parseThreeC(threeCFw?.title ?? null);

  const pvParam = Number.isFinite(selectedPv) ? `?pv=${selectedPv}` : "";

  const pestelFactors = [
    { factor: "POLITICAL"     as const, label: "Political",     bar: "bg-blue-500" },
    { factor: "ECONOMIC"      as const, label: "Economic",      bar: "bg-emerald-500" },
    { factor: "SOCIAL"        as const, label: "Social",        bar: "bg-amber-500" },
    { factor: "TECHNOLOGICAL" as const, label: "Technological", bar: "bg-purple-500" },
    { factor: "ENVIRONMENTAL" as const, label: "Environmental", bar: "bg-cyan-500" },
    { factor: "LEGAL"         as const, label: "Legal",         bar: "bg-red-500" },
  ];

  const sevenSNodes = [
    { key: "strategy" as const, label: "Strategy" },
    { key: "structure" as const, label: "Structure" },
    { key: "systems" as const, label: "Systems" },
    { key: "style" as const, label: "Style" },
    { key: "staff" as const, label: "Staff" },
    { key: "skills" as const, label: "Skills" },
  ];

  const sevenSLayout = sevenSNodes.map((node, index) => {
    const angle = -150 + index * (360 / sevenSNodes.length);
    const radius = 34;
    const radian = (angle * Math.PI) / 180;

    return {
      ...node,
      x: 50 + radius * Math.cos(radian),
      y: 50 + radius * Math.sin(radian),
    };
  });

  function getCenterLineStyle(x: number, y: number) {
    const dx = x - 50;
    const dy = y - 50;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: "50%",
      top: "50%",
      width: `${length}%`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      transformOrigin: "0 50%",
    };
  }

  function getSegmentLineStyle(from: { x: number; y: number }, to: { x: number; y: number }) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: `${from.x}%`,
      top: `${from.y}%`,
      width: `${length}%`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      transformOrigin: "0 50%",
    };
  }

  function getSevenSSummaryText(node: SevenSData[keyof SevenSData]) {
    const text = (node.title.trim() || node.description.trim() || "내용 없음").replace(/\s+/g, " ");
    return text.length > 30 ? `${text.slice(0, 30)}...` : text;
  }

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-6xl space-y-14 py-12 print:space-y-8 print:py-4">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 print:hidden">
          <Link
            href={`/project/${id}${pvParam}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            프로젝트로 돌아가기
          </Link>
          <PrintButton />
        </div>

        {/* Header */}
        <section className="space-y-3 px-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Strategy Report</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{projectName}</h1>
          <p className="text-gray-500">{projectDescription}</p>
          <nav className="flex flex-wrap gap-2 pt-2 print:hidden">
            {(["team", "swot", "pestel", "mckinsey-7s", "double-matrix", "three-c", "persona"] as const).map((a) => (
              <a
                key={a}
                href={`#${a}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
              >
                {a === "team"
                  ? "Team"
                  : a === "mckinsey-7s"
                    ? "McKinsey 7S"
                    : a === "double-matrix"
                      ? "Double Matrix"
                      : a === "three-c"
                        ? "3C Analysis"
                      : a.charAt(0).toUpperCase() + a.slice(1)}
              </a>
            ))}
          </nav>
        </section>

        {/* Team */}
        <section id="team" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-400">Team Introduction</p>
          {profiles.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 팀원이 없습니다.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {profiles.map((m) => (
                <article key={m.id} className="rounded-2xl bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid]">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.avatarColor }} />
                    <p className="font-semibold text-gray-900">{m.name}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SWOT */}
        <section id="swot" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">SWOT Analysis</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Strategic Snapshot</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="swotV"
              currentVersion={swotFw?.version ?? null}
              versions={swotVersions}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {([
              { label: "Strength",    type: "STRENGTH"    as const, bg: "bg-blue-50"   },
              { label: "Weakness",    type: "WEAKNESS"    as const, bg: "bg-red-50"    },
              { label: "Opportunity", type: "OPPORTUNITY" as const, bg: "bg-green-50"  },
              { label: "Threat",      type: "THREAT"      as const, bg: "bg-yellow-50" },
            ]).map(({ label, type, bg }) => {
              const items = swotItems.filter((i) => i.type === type);
              return (
                <article key={label} className={`rounded-2xl p-6 print:break-inside-avoid print:[page-break-inside:avoid] ${bg}`}>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  {items.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
                      {items.map((item) => (
                        <li key={item.id}>
                          • <span className="font-semibold">{item.title}</span>
                          {item.description ? ` - ${item.description}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-gray-400">항목 없음</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* PESTEL */}
        <section id="pestel" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">PESTEL Analysis</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Macro Environment Review</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="pestelV"
              currentVersion={pestelFw?.version ?? null}
              versions={pestelVersions}
            />
          </div>
          <div className="space-y-3">
            {pestelFactors.map(({ factor, label, bar }) => {
              const items = pestelItems.filter((i) => i.factor === factor);
              return (
                <div key={factor} className="relative overflow-hidden rounded-2xl bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid]">
                  <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
                  <div className="grid items-start gap-6 pl-3" style={{ gridTemplateColumns: "140px 1fr" }}>
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    {items.length ? (
                      <ul className="space-y-1 text-sm text-gray-700">
                        {items.map((item) => (
                          <li key={item.id}>
                            • <span className="font-semibold">{item.title}</span>
                            {item.description ? ` - ${item.description}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">항목 없음</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* McKinsey 7S */}
        <section id="mckinsey-7s" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">McKinsey 7S</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Organizational Alignment</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="mck7sV"
              currentVersion={mck7sFw?.version ?? null}
              versions={mck7sVersions}
            />
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="relative mx-auto aspect-square w-full min-w-[680px] max-w-5xl">
              <div className="absolute inset-0 z-10">
                {sevenSLayout.map((node) => (
                  <div
                    key={`center-line-${node.key}`}
                    className="absolute h-px bg-gray-400/40 print:bg-gray-300/30"
                    style={getCenterLineStyle(node.x, node.y)}
                  />
                ))}
                {sevenSLayout.map((node, index) => {
                  const nextNode = sevenSLayout[(index + 1) % sevenSLayout.length];
                  return (
                    <div
                      key={`outer-line-${node.key}-${nextNode.key}`}
                      className="absolute h-px bg-gray-300/35 print:bg-gray-300/25"
                      style={getSegmentLineStyle(node, nextNode)}
                    />
                  );
                })}
              </div>

              {sevenSLayout.map((node) => (
                <article
                  key={node.key}
                  className="absolute z-20 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 break-inside-avoid flex-col items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-center shadow-sm transition-all duration-200 hover:scale-[1.04] hover:border-gray-400 hover:shadow-md sm:h-48 sm:w-48"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{node.label}</p>
                  <p className="mt-2 line-clamp-2 max-w-[130px] text-xs text-gray-500">{getSevenSSummaryText(sevenSData[node.key])}</p>
                </article>
              ))}

              <article className="absolute left-1/2 top-1/2 z-30 flex h-60 w-60 -translate-x-1/2 -translate-y-1/2 break-inside-avoid flex-col items-center justify-center rounded-full border-4 border-blue-200 bg-blue-50/70 px-7 text-center shadow-sm transition-all duration-200 hover:scale-[1.04] hover:shadow-md sm:h-64 sm:w-64">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Shared Values</p>
                <p className="mt-2 line-clamp-2 max-w-[170px] text-sm text-blue-900/80">
                  {getSevenSSummaryText(sevenSData.sharedValues)}
                </p>
              </article>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 print:break-inside-avoid print:[page-break-inside:avoid]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Shared Values</p>
              {sevenSData.sharedValues.title ? (
                <p className="text-xs font-semibold text-blue-900">{sevenSData.sharedValues.title}</p>
              ) : null}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{sevenSData.sharedValues.description || "-"}</p>
            </article>
            {sevenSNodes.map((node) => (
              <article key={`detail-${node.key}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 print:break-inside-avoid print:[page-break-inside:avoid]">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{node.label}</p>
                {sevenSData[node.key].title ? (
                  <p className="text-xs font-semibold text-gray-900">{sevenSData[node.key].title}</p>
                ) : null}
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{sevenSData[node.key].description || "-"}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Double Matrix */}
        <section id="double-matrix" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Double Matrix</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">2x2 Strategic Matrix</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="matrixV"
              currentVersion={matrixFw?.version ?? null}
              versions={matrixVersions}
            />
          </div>
          {matrixData.yAxis && (
            <p className="mb-2 text-sm text-gray-500">
              Y축: <strong className="text-gray-800">{matrixData.yAxis}</strong>
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: "q1" as const, label: "Q1", bg: "bg-blue-50"   },
              { key: "q2" as const, label: "Q2", bg: "bg-green-50"  },
              { key: "q3" as const, label: "Q3", bg: "bg-yellow-50" },
              { key: "q4" as const, label: "Q4", bg: "bg-red-50"    },
            ]).map(({ key, label, bg }) => (
              <article key={key} className={`rounded-2xl p-5 print:break-inside-avoid print:[page-break-inside:avoid] ${bg}`}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{matrixData[key] || "-"}</p>
              </article>
            ))}
          </div>
          {matrixData.xAxis && (
            <p className="mt-2 text-sm text-gray-500">
              X축: <strong className="text-gray-800">{matrixData.xAxis}</strong>
            </p>
          )}
        </section>

        {/* 3C Analysis */}
        <section id="three-c" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid] print:rounded-2xl print:p-6 print:shadow-none">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">3C Analysis</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Customer · Company · Competitor</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="threeCV"
              currentVersion={threeCFw?.version ?? null}
              versions={threeCVersions}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-1 print:gap-3">
            <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid] print:bg-gray-100 print:p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Customer</p>
              <p className="mb-3 text-sm font-semibold text-gray-900 print:mb-2">{threeCData.customer.headline || "-"}</p>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700 print:space-y-1.5 print:text-xs">
                <li><span className="font-semibold">타깃 세그먼트:</span> {threeCData.customer.targetSegment || "-"}</li>
                <li><span className="font-semibold">핵심 니즈:</span> {threeCData.customer.needs || "-"}</li>
                <li><span className="font-semibold">페인 포인트:</span> {threeCData.customer.painPoints || "-"}</li>
                <li><span className="font-semibold">구매 행동:</span> {threeCData.customer.buyingBehavior || "-"}</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid] print:bg-gray-100 print:p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Company</p>
              <p className="mb-3 text-sm font-semibold text-gray-900 print:mb-2">{threeCData.company.headline || "-"}</p>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700 print:space-y-1.5 print:text-xs">
                <li><span className="font-semibold">핵심 강점:</span> {threeCData.company.coreStrength || "-"}</li>
                <li><span className="font-semibold">보유 자원:</span> {threeCData.company.resources || "-"}</li>
                <li><span className="font-semibold">차별화 요소:</span> {threeCData.company.differentiation || "-"}</li>
                <li><span className="font-semibold">내부 역량:</span> {threeCData.company.internalCapabilities || "-"}</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid] print:bg-gray-100 print:p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Competitor</p>
              <p className="mb-3 text-sm font-semibold text-gray-900 print:mb-2">{threeCData.competitor.headline || "-"}</p>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-700 print:space-y-1.5 print:text-xs">
                <li><span className="font-semibold">주요 경쟁사:</span> {threeCData.competitor.keyPlayers || "-"}</li>
                <li><span className="font-semibold">시장 포지셔닝:</span> {threeCData.competitor.marketPosition || "-"}</li>
                <li><span className="font-semibold">강점:</span> {threeCData.competitor.strengths || "-"}</li>
                <li><span className="font-semibold">약점:</span> {threeCData.competitor.weaknesses || "-"}</li>
              </ul>
            </article>
          </div>

          <article className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-6 print:break-inside-avoid print:[page-break-inside:avoid] print:mt-3 print:p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Strategic Insight</p>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-700 print:space-y-1.5 print:text-xs">
              <li><span className="font-semibold">정렬 / 불일치:</span> {threeCData.strategicInsight.alignmentOrMismatch || "-"}</li>
              <li><span className="font-semibold">경쟁 우위:</span> {threeCData.strategicInsight.competitiveAdvantage || "-"}</li>
              <li><span className="font-semibold">전략 방향:</span> {threeCData.strategicInsight.strategicDirection || "-"}</li>
            </ul>
          </article>
        </section>

        {/* Persona Model */}
        <section id="persona" className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm print:break-inside-avoid print:[page-break-inside:avoid]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Persona Model</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Target User Profile</h2>
            </div>
            <ReportVersionSelector
              label="버전"
              paramKey="personaV"
              currentVersion={personaFw?.version ?? null}
              versions={personaVersions}
            />
          </div>
          <div className="mb-6 flex items-center gap-5 rounded-2xl bg-gray-50 p-6 print:break-inside-avoid print:[page-break-inside:avoid]">
            {personaData.photoUrl ? (
              <img src={personaData.photoUrl} alt="persona" className="h-20 w-20 rounded-full object-cover shadow" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                {personaData.name?.[0] ?? "P"}
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-gray-900">{personaData.name || "-"}</p>
              <p className="text-sm text-gray-500">
                {personaData.age ? `${personaData.age}세 · ` : ""}
                {personaData.role}
              </p>
              {personaData.bio && <p className="mt-2 text-sm text-gray-600">{personaData.bio}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(["goals", "painPoints", "behaviors", "needs", "motivations"] as (keyof PersonaData)[]).map((key) => (
              <article key={key} className="rounded-2xl bg-gray-50 p-5 print:break-inside-avoid print:[page-break-inside:avoid]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {key === "painPoints" ? "Pain Points" : key.charAt(0).toUpperCase() + key.slice(1)}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {(personaData[key] as string) || "-"}
                </p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

