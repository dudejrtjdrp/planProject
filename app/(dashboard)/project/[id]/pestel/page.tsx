import { notFound } from "next/navigation";
import { PestelBoard } from "@/components/frameworks/pestel/pestel-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { getFrameworkByKey } from "@/features/frameworks/data/framework-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById } from "@/features/projects/data/project-repository";
import { getPestelItems } from "@/features/pestel/data/pestel-repository";

type ProjectPestelPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ pv?: string }>;
};

export default async function ProjectPestelPage({ params, searchParams }: ProjectPestelPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const [pestelItems, profiles] = await Promise.all([
    getPestelItems(id),
    getProfiles(),
  ]);
  const pestelFramework = await getFrameworkByKey(id, "PESTEL");

  return (
    <div className="space-y-8">
      <header>
        <BackStepButton
          fallbackHref={Number.isFinite(selectedProjectVersion) ? `/project/${id}?pv=${selectedProjectVersion}` : `/project/${id}`}
          label="프로젝트 홈으로"
        />
        <p className="text-sm text-gray-400">프레임워크 · PESTEL</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
      </header>
      <PestelBoard
        projectId={id}
        projectFrameworkId={pestelFramework?.id ?? null}
        items={pestelItems}
        profiles={profiles}
      />
    </div>
  );
}
