"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProjectAction } from "@/features/projects/actions/project-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import type { Project } from "@/features/projects/types/project";

type ProjectListProps = {
  projects: Project[];
  latestVersionByProjectId?: Record<string, number | null>;
};

export function ProjectList({ projects, latestVersionByProjectId }: ProjectListProps) {
  const router = useRouter();

  async function handleDeleteProject(formData: FormData) {
    try {
      await deleteProjectAction(formData);
      pushToast("프로젝트가 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트 삭제에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <p className="text-base text-gray-700">아직 프로젝트가 없습니다. 위에서 첫 번째 프로젝트를 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => {
        const latestVersion = latestVersionByProjectId?.[project.id] ?? null;
        const projectHref = latestVersion ? `/project/${project.id}?pv=${latestVersion}` : `/project/${project.id}`;

        return (
        <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-300">
          <div className="flex items-center justify-between gap-6">
            <Link href={projectHref} className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-gray-900">{project.name}</p>
              <p className="mt-1 truncate text-sm text-gray-400">{project.description ?? "설명 없음"}</p>
            </Link>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={projectHref}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
              >
                열기
              </Link>
              <form action={handleDeleteProject}>
                <FormPendingOverlay message="프로젝트 삭제 중..." />
                <input type="hidden" name="projectId" value={project.id} />
                <FormSubmitButton
                  idleText="삭제"
                  pendingText="삭제 중..."
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-400 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed"
                />
              </form>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
