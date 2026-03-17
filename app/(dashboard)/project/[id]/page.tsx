import { redirect } from "next/navigation";
import { ProjectVersionManager } from "@/components/ui/project-version-manager";
import { ProjectSummary } from "@/features/projects/components/project-summary";
import { getProjectById, getProjectVersion, getProjectVersions } from "@/features/projects/data/project-repository";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    pv?: string;
  }>;
};

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

  const [project, versions] = await Promise.all([
    getProjectById(id),
    getProjectVersions(id),
  ]);

  if (!project) {
    redirect("/projects");
  }

  if (!Number.isFinite(selectedProjectVersion) && versions.length > 0) {
    redirect(`/project/${id}?pv=${versions[0].version}`);
  }

  if (Number.isFinite(selectedProjectVersion)) {
    const exists = versions.some((versionItem) => versionItem.version === selectedProjectVersion);
    if (!exists) {
      const fallbackVersion = versions[0]?.version;
      if (fallbackVersion) {
        redirect(`/project/${id}?pv=${fallbackVersion}`);
      }
      redirect(`/project/${id}`);
    }
  }

  let projectForView = project;

  if (Number.isFinite(selectedProjectVersion)) {
    const snapshot = await getProjectVersion(id, selectedProjectVersion);
    if (snapshot) {
      projectForView = {
        ...project,
        name: snapshot.name,
        description: snapshot.description,
      };
    }
  }

  return (
    <div className="space-y-6">
      <ProjectVersionManager
        projectId={id}
        currentVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
        versions={versions}
      />
      <ProjectSummary
        project={projectForView}
        projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
      />
    </div>
  );
}
