"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteSwotItemAction, updateSwotItemContentAction } from "@/features/swot/actions/swot-actions";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import { stringifySwotContent } from "@/features/swot/types/swot-item";
import type { SwotItem } from "@/features/swot/types/swot-item";

type SwotItemCardProps = {
  item: SwotItem;
  projectId: string;
  profileById: Map<string, { name: string; avatarColor: string }>;
};

export function SwotItemCard({ item, projectId, profileById }: SwotItemCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title);
  const [descriptionDraft, setDescriptionDraft] = useState(item.description);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const author = item.createdBy ? profileById.get(item.createdBy) : null;
  const parsedContent = { title: item.title, description: item.description };

  async function handleUpdate(formData: FormData) {
    try {
      const mergedContent = stringifySwotContent(titleDraft, descriptionDraft);
      formData.set("content", mergedContent);
      await updateSwotItemContentAction(formData);
      setIsEditing(false);
      pushToast("SWOT 항목이 수정되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "SWOT 항목 수정에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 print:shadow-none print:p-3 print:break-inside-avoid ${
        isDragging ? "opacity-60 shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 print:gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          {isEditing ? (
            <form action={handleUpdate} className="space-y-2">
              <FormPendingOverlay message="SWOT 항목 수정 중..." />
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="projectId" value={projectId} />
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                required
                placeholder="제목"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 print:hidden"
              />
              <textarea
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                rows={3}
                placeholder="상세 설명"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100 print:hidden"
              />
              <div className="flex items-center gap-2 print:hidden">
                <FormSubmitButton
                  idleText="저장"
                  pendingText="저장 중..."
                  className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(item.title);
                    setDescriptionDraft(item.description);
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-all duration-200 hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1">
              {parsedContent.title ? (
                <h4 className="text-sm font-semibold leading-relaxed text-gray-900 print:text-xs">{parsedContent.title}</h4>
              ) : null}
              {parsedContent.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 print:text-xs">{parsedContent.description}</p>
              ) : null}
            </div>
          )}
          {author ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 print:text-[10px]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: author.avatarColor }} aria-hidden />
              {author.name}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-400 transition-all duration-200 hover:border-gray-300 print:hidden"
          aria-label="Drag SWOT item"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      </div>

      <div className="mt-4 flex justify-end print:hidden">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-all duration-200 hover:bg-gray-50"
            >
              수정
            </button>
          ) : null}
          <form action={deleteSwotItemAction}>
            <FormPendingOverlay message="SWOT 항목 삭제 중..." />
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
