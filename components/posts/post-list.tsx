"use client";

import { useState } from "react";
import { pushToast } from "@/lib/utils/toast";

export type Post = {
  id: string;
  content: string;
  author: string;
  created_at: string;
};

type PostListProps = {
  posts: Post[];
  currentUser: string;
  onUpdate: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
};

export function PostList({ posts, currentUser, onUpdate, onDelete }: PostListProps) {
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpdate(postId: string) {
    const trimmed = draft.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(postId, trimmed);
      setEditingPostId(null);
      setDraft("");
      pushToast("팀 메모가 수정되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "팀 메모 수정에 실패했습니다.";
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(postId: string) {
    const confirmed = window.confirm("이 팀 메모를 삭제할까요?");
    if (!confirmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onDelete(postId);
      pushToast("팀 메모가 삭제되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "팀 메모 삭제에 실패했습니다.";
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-base text-gray-700 shadow-sm">
        No posts yet.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-gray-900">{post.author}</span>
            <span className="text-sm text-gray-400">
              {new Date(post.created_at).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {editingPostId === post.id ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate(post.id)}
                  disabled={isSubmitting || !draft.trim()}
                  className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-200"
                >
                  {isSubmitting ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(null);
                    setDraft("");
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">{post.content}</p>
              {post.author === currentUser ? (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(post.id);
                      setDraft(post.content);
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                </div>
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
