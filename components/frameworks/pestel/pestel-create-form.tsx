"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PestelFactor } from "@/features/pestel/types/pestel-item";
import { stringifyPestelContent } from "@/features/pestel/types/pestel-item";
import { createPestelItemAction } from "@/features/pestel/actions/pestel-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type PestelCreateFormProps = {
  projectId: string;
  projectFrameworkId: string | null;
  canCreate: boolean;
  factor: PestelFactor;
  placeholder: string;
};

export function PestelCreateForm({ projectId, projectFrameworkId, canCreate, factor, placeholder }: PestelCreateFormProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const profileName = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setCurrentUser(profileName);
  }, []);

  async function handleCreate(formData: FormData) {
    const mergedContent = stringifyPestelContent(title, description);
    formData.set("content", mergedContent);

    if (!title.trim()) {
      pushToast("제목을 입력해 주세요.", "error");
      return;
    }

    pushToast("저장 중...");
    try {
      await createPestelItemAction(formData);
      setTitle("");
      setDescription("");
      pushToast("PESTEL 항목이 추가되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "PESTEL 항목 추가에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <form action={handleCreate} className="space-y-3">
      <FormPendingOverlay message="PESTEL 항목 저장 중..." />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectFrameworkId" value={projectFrameworkId ?? ""} />
      <input type="hidden" name="factor" value={factor} />
      <input type="hidden" name="createdBy" value={currentUser} />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        disabled={!canCreate}
        placeholder="제목"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        disabled={!canCreate}
        placeholder={`${placeholder} 상세 설명`}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <div className="space-y-1">
        <label htmlFor={`pestel-attachment-${factor}`} className="text-xs font-medium text-gray-500">
          첨부 파일 (이미지/PDF, 최대 10MB)
        </label>
        <input
          id={`pestel-attachment-${factor}`}
          type="file"
          name="attachment"
          disabled={!canCreate}
          accept="image/*,application/pdf"
          className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-blue-600 hover:file:bg-blue-100"
        />
      </div>
      {!canCreate ? <p className="text-xs text-amber-600">프로젝트 버전이 없어 PESTEL 항목을 추가할 수 없습니다.</p> : null}
      <div className="flex justify-end">
        <FormSubmitButton
          idleText="추가"
          pendingText="저장 중..."
          disabled={!currentUser || !canCreate}
          className="rounded-xl bg-[#3182F6] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        />
      </div>
    </form>
  );
}
