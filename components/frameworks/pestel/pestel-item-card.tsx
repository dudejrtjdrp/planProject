"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deletePestelItemAction, updatePestelItemContentAction } from "@/features/pestel/actions/pestel-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import type { PestelItem } from "@/features/pestel/types/pestel-item";

type PestelItemCardProps = {
  item: PestelItem;
  projectId: string;
  profileById: Map<string, { name: string; avatarColor: string }>;
};

export function PestelItemCard({ item, projectId, profileById }: PestelItemCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const author = item.createdBy ? profileById.get(item.createdBy) : null;
  const isImageAttachment = Boolean(item.attachmentUrl && item.attachmentMimeType?.startsWith("image/"));

  async function handleDelete(formData: FormData) {
    try {
      await deletePestelItemAction(formData);
      pushToast("PESTEL 항목이 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "PESTEL 항목 삭제에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    try {
      await updatePestelItemContentAction(formData);
      setIsEditing(false);
      pushToast("PESTEL 항목이 수정되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "PESTEL 항목 수정에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
        isDragging ? "opacity-60 shadow-md" : ""
      }`}
    >
      <div className="min-w-0 space-y-3">
        {isEditing ? (
          <form action={handleUpdate} className="space-y-2">
            <FormPendingOverlay message="PESTEL 항목 수정 중..." />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <textarea
              name="content"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              required
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex items-center gap-2">
              <FormSubmitButton
                idleText="저장"
                pendingText="저장 중..."
                className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
              />
              <button
                type="button"
                onClick={() => {
                  setDraft(item.content);
                  setIsEditing(false);
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-all duration-200 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-gray-700">{item.content}</p>
            {item.attachmentUrl ? (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {isImageAttachment ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.attachmentUrl}
                    alt={item.attachmentName ?? "PESTEL 첨부 이미지"}
                    className="max-h-60 w-auto rounded-md border border-gray-200 object-contain"
                  />
                ) : null}
                <a
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                >
                  첨부 열기{item.attachmentName ? `: ${item.attachmentName}` : ""}
                </a>
              </div>
            ) : null}
          </div>
        )}
        {author ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: author.avatarColor }}
              aria-hidden
            />
            {author.name}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-400 transition-all duration-200 hover:border-gray-300"
            aria-label="Drag PESTEL item"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-all duration-200 hover:bg-gray-50"
            >
              수정
            </button>
          ) : null}

          <form action={handleDelete}>
            <FormPendingOverlay message="PESTEL 항목 삭제 중..." />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <FormSubmitButton
              idleText="삭제"
              pendingText="삭제 중..."
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      </div>
    </article>
  );
}
