import { redirect } from "next/navigation";
import { SwotBoard } from "@/components/frameworks/swot/swot-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import { getFrameworkByKey, getFrameworkByVersion, getFrameworkVersionsByKey } from "@/features/frameworks/data/framework-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById, getProjectVersions } from "@/features/projects/data/project-repository";
import { getSwotItemsByFrameworkId } from "@/features/swot/data/swot-repository";

type ProjectSwotPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ fv?: string; pv?: string }>;
};

export default async function ProjectSwotPage({ params, searchParams }: ProjectSwotPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);
  const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
  const hasProjectVersion = projectVersions.length > 0;

  if (!project) {
    redirect("/projects");
  }

  const frameworkVersions = await getFrameworkVersionsByKey(id, "SWOT");
  const swotFramework = Number.isFinite(selectedVersion)
    ? await getFrameworkByVersion(id, "SWOT", selectedVersion)
    : await getFrameworkByKey(id, "SWOT");

  if (!Number.isFinite(selectedVersion) && swotFramework) {
    const query = new URLSearchParams({ fv: String(swotFramework.version) });
    if (Number.isFinite(selectedProjectVersion)) {
      query.set("pv", String(selectedProjectVersion));
    }
    redirect(`/project/${id}/swot?${query.toString()}`);
  }

  if (Number.isFinite(selectedVersion) && !swotFramework) {
    const fallbackVersion = frameworkVersions[0]?.version;
    if (fallbackVersion) {
      const query = new URLSearchParams({ fv: String(fallbackVersion) });
      if (Number.isFinite(selectedProjectVersion)) {
        query.set("pv", String(selectedProjectVersion));
      }
      redirect(`/project/${id}/swot?${query.toString()}`);
    }
    redirect(
      Number.isFinite(selectedProjectVersion)
        ? `/project/${id}/swot?pv=${selectedProjectVersion}`
        : `/project/${id}/swot`,
    );
  }

  const swotItems = swotFramework ? await getSwotItemsByFrameworkId(swotFramework.id) : [];
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

      <FrameworkVersionManager
        projectId={id}
        frameworkKey="SWOT"
        basePath={`/project/${id}/swot`}
        projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
        hasProjectVersion={hasProjectVersion}
        currentFrameworkId={swotFramework?.id ?? null}
        currentVersion={swotFramework?.version ?? null}
        versions={frameworkVersions}
      />

      <SwotBoard
        key={swotFramework?.id ?? "swot-empty"}
        projectId={id}
        projectFrameworkId={swotFramework?.id ?? null}
        currentVersion={swotFramework?.version ?? null}
        canCreate={hasProjectVersion}
        items={swotItems}
        profiles={profiles}
      />
    </div>
  );
}
