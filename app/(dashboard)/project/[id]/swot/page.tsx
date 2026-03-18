import { notFound } from "next/navigation";
import { SwotBoard } from "@/components/frameworks/swot/swot-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { getFrameworkByKey } from "@/features/frameworks/data/framework-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById } from "@/features/projects/data/project-repository";
import { getSwotItems } from "@/features/swot/data/swot-repository";

type ProjectSwotPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ pv?: string }>;
};

export default async function ProjectSwotPage({ params, searchParams }: ProjectSwotPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const swotFramework = await getFrameworkByKey(id, "SWOT");
  const swotItems = await getSwotItems(id);
  const profiles = await getProfiles();

  return (
    <div className="space-y-8">
      <header>
        <BackStepButton
          fallbackHref={Number.isFinite(selectedProjectVersion) ? `/project/${id}?pv=${selectedProjectVersion}` : `/project/${id}`}
          label="프로젝트 홈으로"
        />
        <p className="text-sm text-gray-400">프레임워크 · SWOT</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
      </header>
      <SwotBoard
        projectId={id}
        projectFrameworkId={swotFramework?.id ?? null}
        items={swotItems}
        profiles={profiles}
      />
    </div>
  );
}
