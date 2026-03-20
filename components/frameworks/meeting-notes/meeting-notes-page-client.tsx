"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteProjectMeetingNoteAction,
} from "@/features/projects/actions/project-meeting-note-actions";
import type { ProjectMeetingNote } from "@/features/projects/types/project-meeting-note";
import type { Profile } from "@/features/profiles/types/profile";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { MeetingNotesEditor } from "@/components/meeting-notes/meeting-notes-editor";
import { pushToast } from "@/lib/utils/toast";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type MeetingNotesPageClientProps = {
  projectId: string;
  notes: ProjectMeetingNote[];
  profiles: Profile[];
};

export function MeetingNotesPageClient({ projectId, notes, profiles }: MeetingNotesPageClientProps) {
  const [currentUserName, setCurrentUserName] = useState("");
  const [noteItems, setNoteItems] = useState<ProjectMeetingNote[]>(notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id ?? null);

  useEffect(() => {
    setNoteItems(notes);
    setSelectedNoteId(notes[0]?.id ?? null);
  }, [notes]);

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

  async function handleDelete(formData: FormData) {
    pushToast("삭제 중...");
    try {
      const noteId = String(formData.get("noteId") ?? "").trim();
      await deleteProjectMeetingNoteAction(formData);
      setNoteItems((prev) => prev.filter((item) => item.id !== noteId));
      pushToast("회의록이 삭제되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "회의록 삭제에 실패했습니다.";
      pushToast(message, "error");
    }
  }

  function handleAutoSaved(note: ProjectMeetingNote) {
    setSelectedNoteId(note.id);
    setNoteItems((prev) => {
      const exists = prev.some((item) => item.id === note.id);
      if (exists) {
        return prev
          .map((item) => (item.id === note.id ? note : item))
          .sort((a, b) => {
            if (a.meetingDate === b.meetingDate) {
              return b.createdAt.localeCompare(a.createdAt);
            }
            return b.meetingDate.localeCompare(a.meetingDate);
          });
      }

      return [note, ...prev].sort((a, b) => {
        if (a.meetingDate === b.meetingDate) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return b.meetingDate.localeCompare(a.meetingDate);
      });
    });
  }

  const editableNote = selectedNoteId ? noteItems.find((note) => note.id === selectedNoteId) ?? null : null;

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSelectedNoteId(null)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          새 회의록 작성
        </button>
      </div>

      <MeetingNotesEditor
        projectId={projectId}
        createdBy={currentUserName}
        initialNote={editableNote}
        onSaved={handleAutoSaved}
      />

      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">회의록 목록</h2>
        {noteItems.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">등록된 회의록이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {noteItems.map((note) => {
              const author = note.createdBy ? profileById.get(note.createdBy) : null;
              const isSelected = selectedNoteId === note.id;
              return (
                <article key={note.id} className={`rounded-2xl border p-4 ${isSelected ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{note.meetingDate}</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedNoteId(note.id)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        수정
                      </button>
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
