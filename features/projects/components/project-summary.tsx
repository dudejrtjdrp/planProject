"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction, updateProjectAction } from "@/features/projects/actions/project-actions";
import { FrameworkLinkButton } from "@/components/ui/framework-link-button";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";
import type { Project } from "@/features/projects/types/project";

type ProjectSummaryProps = {
  project: Project;
  projectVersion: number | null;
};

export function ProjectSummary({ project, projectVersion }: ProjectSummaryProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [commitMessage, setCommitMessage] = useState("");
  const [editorName, setEditorName] = useState("");
  const [saveMode, setSaveMode] = useState<"publish" | "draft">("publish");
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(false);
  const lastDraftPayloadRef = useRef("");

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
  }, [project.id, project.name, project.description]);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setEditorName(saved);
  }, []);

  const pvParam = projectVersion ? `?pv=${projectVersion}` : "";
  const swotHref = `/project/${project.id}/swot${pvParam}`;
  const pestelHref = `/project/${project.id}/pestel${pvParam}`;
  const mckinsey7sHref = `/project/${project.id}/mckinsey-7s${pvParam}`;
  const doubleMatrixHref = `/project/${project.id}/double-matrix${pvParam}`;
  const personaModelHref = `/project/${project.id}/persona-model${pvParam}`;
  const threeCAnalysisHref = `/project/${project.id}/3c-analysis${pvParam}`;
  const reportHref = `/project/${project.id}/report${pvParam}`;
  const meetingNotesHref = `/project/${project.id}/meeting-notes${pvParam}`;

  async function handleUpdateProject(formData: FormData) {
    try {
      await updateProjectAction(formData);
      pushToast("프로젝트가 수정되었습니다.");
      setCommitMessage("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트 수정에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  useEffect(() => {
    if (!autoDraftEnabled) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const serialized = JSON.stringify({ name, description });
      if (serialized === lastDraftPayloadRef.current) {
        return;
      }

      try {
        const formData = new FormData();
        formData.set("projectId", project.id);
        formData.set("name", name);
        formData.set("description", description);
        formData.set("editorName", editorName);
        formData.set("commitMessage", "자동 임시 저장");
        formData.set("saveMode", "draft");
        await updateProjectAction(formData);
        lastDraftPayloadRef.current = serialized;
        pushToast("임시 저장되었습니다.");
      } catch {
        pushToast("임시 저장에 실패했습니다.", "error");
      }
    }, 180000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoDraftEnabled, description, editorName, name, project.id]);

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
          <FrameworkLinkButton href={threeCAnalysisHref} label="3C Analysis" />
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
          <input type="hidden" name="editorName" value={editorName} />
          <input type="hidden" name="saveMode" value={saveMode} />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">프로젝트 이름</span>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">설명</span>
            <input
              type="text"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">커밋 메시지 (선택)</span>
            <input
              type="text"
              name="commitMessage"
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="예: 사업 방향 문구 정리 및 설명 업데이트"
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={saveMode === "draft"}
                onChange={(event) => setSaveMode(event.target.checked ? "draft" : "publish")}
                className="h-4 w-4 rounded border-gray-300"
              />
              Draft 모드로 저장
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoDraftEnabled}
                onChange={(event) => setAutoDraftEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              3분 자동 임시 저장
            </label>
          </div>
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
