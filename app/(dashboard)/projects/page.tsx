import { ProjectList } from "@/features/projects/components/project-list";
import { ProjectCreateForm } from "@/features/projects/components/project-create-form";
import { getProjects, getProjectVersions, isMissingProjectsTableError } from "@/features/projects/data/project-repository";
import type { Project } from "@/features/projects/types/project";

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let latestVersionByProjectId: Record<string, number | null> = {};
  let schemaSetupMessage: string | null = null;

  try {
    projects = await getProjects();
  } catch (error) {
    if (isMissingProjectsTableError(error)) {
      schemaSetupMessage =
        "프로젝트 테이블이 아직 생성되지 않았습니다. Supabase migration을 실행한 뒤 새로고침하세요.";
    } else {
      throw error;
    }
  }

  if (projects.length > 0) {
    const versionEntries = await Promise.all(
      projects.map(async (project) => {
        const versions = await getProjectVersions(project.id);
        return [project.id, versions[0]?.version ?? null] as const;
      }),
    );

    latestVersionByProjectId = Object.fromEntries(versionEntries);
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">프로젝트</h2>
        <p className="mt-2 text-base text-gray-700">전략 플래닝 워크스페이스를 관리하세요.</p>
      </div>
      {schemaSetupMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">{schemaSetupMessage}</div>
      ) : null}
      <ProjectCreateForm />
      <ProjectList projects={projects} latestVersionByProjectId={latestVersionByProjectId} />
    </section>
  );
}
