"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { upsertProjectMeetingNoteAction } from "@/features/projects/actions/project-meeting-note-actions";
import type { ProjectMeetingNote } from "@/features/projects/types/project-meeting-note";

type MeetingNotesEditorProps = {
  projectId: string;
  createdBy: string;
  initialNote: ProjectMeetingNote | null;
  onSaved: (note: ProjectMeetingNote) => void;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_MARKDOWN = `# 회의 제목

## 논의 배경
- 배경을 정리하세요.

## 핵심 논의
1. 안건 1
2. 안건 2

---

## 액션 아이템
- 담당자:
- 일정:
`;

export function MeetingNotesEditor({ projectId, createdBy, initialNote, onSaved }: MeetingNotesEditorProps) {
  const [noteId, setNoteId] = useState<string>(initialNote?.id ?? "");
  const [title, setTitle] = useState<string>(initialNote?.title ?? "회의록");
  const [meetingDate, setMeetingDate] = useState<string>(initialNote?.meetingDate ?? new Date().toISOString().slice(0, 10));
  const [markdown, setMarkdown] = useState<string>(initialNote?.content ?? DEFAULT_MARKDOWN);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPreview, setShowPreview] = useState(false);

  const debounceTimerRef = useRef<number | null>(null);
  const lastSavedPayloadRef = useRef<string>("");
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    setNoteId(initialNote?.id ?? "");
    setTitle(initialNote?.title ?? "회의록");
    setMeetingDate(initialNote?.meetingDate ?? new Date().toISOString().slice(0, 10));
    setMarkdown(initialNote?.content ?? DEFAULT_MARKDOWN);
    setSaveState("idle");
    setShowPreview(false);
  }, [initialNote]);

  const payload = useMemo(
    () => ({
      noteId,
      projectId,
      createdBy,
      title: title.trim(),
      content: markdown.trim(),
      meetingDate,
    }),
    [noteId, projectId, createdBy, title, markdown, meetingDate],
  );

  useEffect(() => {
    const shouldSkipSave =
      !payload.projectId ||
      !payload.createdBy ||
      !payload.title ||
      !payload.content ||
      !payload.meetingDate;

    if (shouldSkipSave) {
      return;
    }

    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastSavedPayloadRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      const sequence = requestSequenceRef.current + 1;
      requestSequenceRef.current = sequence;
      setSaveState("saving");

      try {
        const formData = new FormData();
        formData.set("noteId", payload.noteId);
        formData.set("projectId", payload.projectId);
        formData.set("createdBy", payload.createdBy);
        formData.set("title", payload.title);
        formData.set("content", payload.content);
        formData.set("meetingDate", payload.meetingDate);

        const result = await upsertProjectMeetingNoteAction(formData);

        if (requestSequenceRef.current !== sequence) {
          return;
        }

        setNoteId(result.note.id);
        lastSavedPayloadRef.current = JSON.stringify({
          ...payload,
          noteId: result.note.id,
        });
        setSaveState("saved");
        onSaved(result.note);
      } catch {
        if (requestSequenceRef.current === sequence) {
          setSaveState("error");
        }
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [payload, onSaved]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Meeting Notes</h2>
          <p className="mt-1 text-sm text-gray-500">Markdown으로 작성하고 프리뷰 버튼으로 문서 형태를 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">
            회의 일자
            <input
              type="date"
              value={meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              className="ml-2 h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              saveState === "saving"
                ? "bg-amber-50 text-amber-700"
                : saveState === "saved"
                  ? "bg-emerald-50 text-emerald-700"
                  : saveState === "error"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {saveState === "saving"
              ? "Saving..."
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "저장 실패"
                  : "대기 중"}
          </span>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {showPreview ? "프리뷰 닫기" : "프리뷰 보기"}
          </button>
        </div>
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium text-gray-500">회의 제목</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
          placeholder="예: 3C 전략 정렬 회의"
        />
      </label>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm font-semibold text-gray-700">Markdown Editor</p>
        <textarea
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          className="h-[620px] w-full resize-none rounded-xl border border-gray-200 bg-white p-4 font-medium text-sm leading-relaxed text-gray-800 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
          placeholder="# 회의록 제목\n\n## 아젠다\n- 항목"
        />
      </div>

      {showPreview ? (
        <article className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="mb-5 text-sm font-semibold text-gray-700">Live Preview</p>
          <div className="prose prose-gray max-w-none leading-relaxed [&_h1]:mb-5 [&_h1]:mt-10 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-8 [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:my-4 [&_ul]:pl-6">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdown}</ReactMarkdown>
          </div>
        </article>
      ) : null}
    </section>
  );
}
