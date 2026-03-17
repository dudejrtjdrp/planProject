"use client";

import { useState } from "react";
import { pushToast } from "@/lib/utils/toast";

type PostInputProps = {
  onSubmit: (content: string) => Promise<void>;
};

export function PostInput({ onSubmit }: PostInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
      pushToast("포스트가 등록되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "포스트 등록에 실패했습니다.";
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="팀 메모를 남겨보세요"
        rows={6}
        className="w-full resize-none rounded-2xl border border-gray-200 px-5 py-4 text-base text-gray-700 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
