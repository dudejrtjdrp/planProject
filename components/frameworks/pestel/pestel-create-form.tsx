"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PestelFactor } from "@/features/pestel/types/pestel-item";
import { createPestelItemAction } from "@/features/pestel/actions/pestel-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type PestelCreateFormProps = {
  projectId: string;
  projectFrameworkId: string | null;
  factor: PestelFactor;
  placeholder: string;
};

export function PestelCreateForm({ projectId, projectFrameworkId, factor, placeholder }: PestelCreateFormProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    const profileName = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setCurrentUser(profileName);
  }, []);

  async function handleCreate(formData: FormData) {
    try {
      await createPestelItemAction(formData);
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
      <textarea
        name="content"
        required
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex justify-end">
        <FormSubmitButton
          idleText="추가"
          pendingText="저장 중..."
          disabled={!currentUser}
          className="rounded-xl bg-[#3182F6] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        />
      </div>
    </form>
  );
}
