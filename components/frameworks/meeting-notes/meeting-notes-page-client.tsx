"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProjectMeetingNoteAction,
  deleteProjectMeetingNoteAction,
} from "@/features/projects/actions/project-meeting-note-actions";
import type { ProjectMeetingNote } from "@/features/projects/types/project-meeting-note";
import type { Profile } from "@/features/profiles/types/profile";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type MeetingNotesPageClientProps = {
  projectId: string;
  notes: ProjectMeetingNote[];
  profiles: Profile[];
};

export function MeetingNotesPageClient({ projectId, notes, profiles }: MeetingNotesPageClientProps) {
  const router = useRouter();
  const [currentUserName, setCurrentUserName] = useState("");

  const profileById = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const profile of profiles) {
      map.set(profile.id, profile);
    }
    return map;
  }, [profiles]);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setCurrentUserName(saved);
  }, []);

  async function handleCreate(formData: FormData) {
    pushToast("저장 중...");
    try {
      await createProjectMeetingNoteAction(formData);
      pushToast("회의록이 저장되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "회의록 저장에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  async function handleDelete(formData: FormData) {
    pushToast("삭제 중...");
    try {
      await deleteProjectMeetingNoteAction(formData);
      pushToast("회의록이 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "회의록 삭제에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">프로젝트 회의록 추가</h2>
        <p className="mt-2 text-sm text-gray-600">프로젝트 단위 논의 사항과 결론을 저장해 팀 기록으로 남기세요.</p>

        <form action={handleCreate} className="mt-5 space-y-3">
          <FormPendingOverlay message="회의록 저장 중..." />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="createdBy" value={currentUserName} />

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-gray-500">회의 일자</span>
            <input
              type="date"
              name="meetingDate"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-gray-500">회의 제목</span>
            <input
              type="text"
              name="title"
              placeholder="예: PESTEL 리스크 우선순위 정리"
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-gray-500">회의 내용</span>
            <textarea
              name="content"
              rows={5}
              placeholder="핵심 논의 내용, 결정 사항, 액션 아이템을 입력하세요"
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <div className="flex justify-end">
            <FormSubmitButton
              idleText="회의록 저장"
              pendingText="저장 중..."
              disabled={!currentUserName}
              className="rounded-xl bg-[#3182F6] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-200"
            />
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">회의록 목록</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">등록된 회의록이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {notes.map((note) => {
              const author = note.createdBy ? profileById.get(note.createdBy) : null;
              return (
                <article key={note.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{note.meetingDate}</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
                    </div>
                    <form action={handleDelete}>
                      <FormPendingOverlay message="회의록 삭제 중..." />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="noteId" value={note.id} />
                      <FormSubmitButton
                        idleText="삭제"
                        pendingText="삭제 중..."
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      />
                    </form>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{note.content}</p>

                  {author ? (
                    <p className="mt-3 text-xs text-gray-500">
                      작성자: <span className="font-medium text-gray-700">{author.name}</span>
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
