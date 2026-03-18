"use client";

import { useEffect, useState } from "react";
import type { SwotType } from "@/features/swot/types/swot-item";
import { stringifySwotContent } from "@/features/swot/types/swot-item";
import { createSwotItemAction } from "@/features/swot/actions/swot-actions";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type SwotCreateFormProps = {
  projectId: string;
  projectFrameworkId: string | null;
  type: SwotType;
  placeholder: string;
};

export function SwotCreateForm({ projectId, projectFrameworkId, type, placeholder }: SwotCreateFormProps) {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const structuredContent = stringifySwotContent(title, description);

  useEffect(() => {
    const profileName = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
    setCurrentUser(profileName);
  }, []);

  return (
    <form action={createSwotItemAction} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectFrameworkId" value={projectFrameworkId ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="createdBy" value={currentUser} />
      <input type="hidden" name="content" value={structuredContent} />
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        placeholder="제목"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        placeholder={`${placeholder} 상세 설명`}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!currentUser}
          className="rounded-xl bg-[#3182F6] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
        >
          추가
        </button>
      </div>
    </form>
  );
}
