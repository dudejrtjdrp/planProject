"use client";

import { useRouter } from "next/navigation";
import { createProjectAction } from "@/features/projects/actions/project-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";

export function ProjectCreateForm() {
  const router = useRouter();

  async function handleCreateProject(formData: FormData) {
    try {
      const result = await createProjectAction(formData);
      pushToast("프로젝트가 생성되었습니다.");
      router.refresh();

      if (result?.projectId) {
        router.push(`/project/${result.projectId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "프로젝트 생성에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <form action={handleCreateProject} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <FormPendingOverlay message="프로젝트 생성 중..." />
      <h2 className="mb-6 text-xl font-semibold text-gray-900">새 프로젝트 만들기</h2>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">프로젝트 이름</span>
          <input
            type="text"
            name="name"
            required
            placeholder="새 전략 이니셔티브"
            className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">설명 (선택)</span>
          <input
            type="text"
            name="description"
            placeholder="프로젝트에 대한 간략한 설명"
            className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <FormSubmitButton
          idleText="만들기"
          pendingText="생성 중..."
          className="h-11 rounded-xl bg-[#3182F6] px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        />
      </div>
    </form>
  );
}
