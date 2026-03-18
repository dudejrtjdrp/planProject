"use client";

import { useRouter } from "next/navigation";
import { deleteProjectAction, updateProjectAction } from "@/features/projects/actions/project-actions";
import { FrameworkLinkButton } from "@/components/ui/framework-link-button";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import type { Project } from "@/features/projects/types/project";

type ProjectSummaryProps = {
  project: Project;
  projectVersion: number | null;
};

export function ProjectSummary({ project, projectVersion }: ProjectSummaryProps) {
  const router = useRouter();

  const pvParam = projectVersion ? `?pv=${projectVersion}` : "";
  const swotHref = `/project/${project.id}/swot${pvParam}`;
  const pestelHref = `/project/${project.id}/pestel${pvParam}`;
  const mckinsey7sHref = `/project/${project.id}/mckinsey-7s${pvParam}`;
  const doubleMatrixHref = `/project/${project.id}/double-matrix${pvParam}`;
  const personaModelHref = `/project/${project.id}/persona-model${pvParam}`;
  const reportHref = `/project/${project.id}/report${pvParam}`;
  const meetingNotesHref = `/project/${project.id}/meeting-notes${pvParam}`;

  async function handleUpdateProject(formData: FormData) {
    try {
      await updateProjectAction(formData);
      pushToast("프로젝트가 수정되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트 수정에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  async function handleDeleteProject(formData: FormData) {
    try {
      await deleteProjectAction(formData);
      pushToast("프로젝트가 삭제되었습니다.");
      router.push("/projects");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트 삭제에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-gray-400">Project</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">{project.name}</h2>
          {projectVersion ? (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
              Project v{projectVersion}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-base text-gray-700">{project.description ?? "설명이 없습니다."}</p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="mb-5 text-xl font-semibold text-gray-900">프레임워크</h3>
        <div className="flex flex-wrap gap-3">
          <FrameworkLinkButton href={swotHref} label="SWOT 분석" />
          <FrameworkLinkButton href={pestelHref} label="PESTEL 분석" />
          <FrameworkLinkButton href={mckinsey7sHref} label="McKinsey 7S" />
          <FrameworkLinkButton href={doubleMatrixHref} label="Double Matrix" />
          <FrameworkLinkButton href={personaModelHref} label="Persona Model" />
          <FrameworkLinkButton href={meetingNotesHref} label="프로젝트 회의록" />
          <FrameworkLinkButton href={reportHref} label="분석 리포트" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-400">프로젝트 ID: {project.id}</p>
        <p className="mt-1 text-sm text-gray-400">마지막 수정: {new Date(project.updatedAt).toLocaleString("ko-KR")}</p>

        <form action={handleUpdateProject} className="mt-6 space-y-3">
          <FormPendingOverlay message="프로젝트 수정 중..." />
          <input type="hidden" name="projectId" value={project.id} />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">프로젝트 이름</span>
            <input
              type="text"
              name="name"
              required
              defaultValue={project.name}
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">설명</span>
            <input
              type="text"
              name="description"
              defaultValue={project.description ?? ""}
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <FormSubmitButton
            idleText="프로젝트 수정"
            pendingText="수정 중..."
            className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
          />
        </form>

        <form action={handleDeleteProject} className="mt-6">
          <FormPendingOverlay message="프로젝트 삭제 중..." />
          <input type="hidden" name="projectId" value={project.id} />
          <FormSubmitButton
            idleText="프로젝트 삭제"
            pendingText="삭제 중..."
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-400 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed"
          />
        </form>
      </div>
    </section>
  );
}
