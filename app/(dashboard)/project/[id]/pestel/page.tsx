import { redirect } from "next/navigation";
import { PestelBoard } from "@/components/frameworks/pestel/pestel-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import { getFrameworkByKey, getFrameworkByVersion, getFrameworkVersionsByKey } from "@/features/frameworks/data/framework-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById, getProjectVersions } from "@/features/projects/data/project-repository";
import { getPestelItemsByFrameworkId } from "@/features/pestel/data/pestel-repository";

type ProjectPestelPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ fv?: string; pv?: string }>;
};

export default async function ProjectPestelPage({ params, searchParams }: ProjectPestelPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);
  const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
  const hasProjectVersion = projectVersions.length > 0;

  if (!project) {
    redirect("/projects");
  }

  const frameworkVersions = await getFrameworkVersionsByKey(id, "PESTEL");
  const pestelFramework = Number.isFinite(selectedVersion)
    ? await getFrameworkByVersion(id, "PESTEL", selectedVersion)
    : await getFrameworkByKey(id, "PESTEL");

  if (!Number.isFinite(selectedVersion) && pestelFramework) {
    const query = new URLSearchParams({ fv: String(pestelFramework.version) });
    if (Number.isFinite(selectedProjectVersion)) {
      query.set("pv", String(selectedProjectVersion));
    }
    redirect(`/project/${id}/pestel?${query.toString()}`);
  }

  if (Number.isFinite(selectedVersion) && !pestelFramework) {
    const fallbackVersion = frameworkVersions[0]?.version;
    if (fallbackVersion) {
      const query = new URLSearchParams({ fv: String(fallbackVersion) });
      if (Number.isFinite(selectedProjectVersion)) {
        query.set("pv", String(selectedProjectVersion));
      }
      redirect(`/project/${id}/pestel?${query.toString()}`);
    }
    redirect(
      Number.isFinite(selectedProjectVersion)
        ? `/project/${id}/pestel?pv=${selectedProjectVersion}`
        : `/project/${id}/pestel`,
    );
  }

  const [pestelItems, profiles] = await Promise.all([
    pestelFramework ? getPestelItemsByFrameworkId(pestelFramework.id) : Promise.resolve([]),
    getProfiles(),
  ]);

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

      <FrameworkVersionManager
        projectId={id}
        frameworkKey="PESTEL"
        basePath={`/project/${id}/pestel`}
        projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
        hasProjectVersion={hasProjectVersion}
        currentFrameworkId={pestelFramework?.id ?? null}
        currentVersion={pestelFramework?.version ?? null}
        versions={frameworkVersions}
      />

      <PestelBoard
        key={pestelFramework?.id ?? "pestel-empty"}
        projectId={id}
        projectFrameworkId={pestelFramework?.id ?? null}
        currentVersion={pestelFramework?.version ?? null}
        canCreate={hasProjectVersion}
        items={pestelItems}
        profiles={profiles}
      />
    </div>
  );
}
