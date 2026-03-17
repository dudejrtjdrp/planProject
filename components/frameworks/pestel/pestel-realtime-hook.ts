"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PestelItem, PestelFactor } from "@/features/pestel/types/pestel-item";

type PestelRealtimeRow = {
  id: string;
  project_framework_id: string;
  factor: PestelFactor;
  content: string;
  position?: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type UsePestelRealtimeOptions = {
  projectFrameworkId: string | null;
  onInsert: (row: PestelRealtimeRow) => void;
  onUpdate: (row: PestelRealtimeRow) => void;
  onDelete: (row: Pick<PestelRealtimeRow, "id" | "project_framework_id">) => void;
};

export function usePestelRealtime({ projectFrameworkId, onInsert, onUpdate, onDelete }: UsePestelRealtimeOptions) {
  useEffect(() => {
    if (!projectFrameworkId) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`pestel-items-${projectFrameworkId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pestel_items",
          filter: `project_framework_id=eq.${projectFrameworkId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            onInsert(payload.new as PestelRealtimeRow);
            return;
          }

          if (payload.eventType === "UPDATE") {
            onUpdate(payload.new as PestelRealtimeRow);
            return;
          }

          if (payload.eventType === "DELETE") {
            onDelete(payload.old as Pick<PestelRealtimeRow, "id" | "project_framework_id">);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectFrameworkId, onDelete, onInsert, onUpdate]);
}
