"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SwotDbQuadrant } from "@/features/swot/types/swot-item";

type SwotRealtimeRow = {
	id: string;
	project_framework_id: string;
	created_by: string | null;
	quadrant: SwotDbQuadrant;
	content: string;
	position: number;
	created_at: string;
	updated_at: string;
};

type UseSwotRealtimeOptions = {
	projectFrameworkId: string | null;
	onInsert: (row: SwotRealtimeRow) => void;
	onUpdate: (row: SwotRealtimeRow) => void;
	onDelete: (row: Pick<SwotRealtimeRow, "id" | "project_framework_id">) => void;
};

export function useSwotRealtime({ projectFrameworkId, onInsert, onUpdate, onDelete }: UseSwotRealtimeOptions) {
	useEffect(() => {
		if (!projectFrameworkId) {
			return;
		}

		const supabase = createSupabaseBrowserClient();
		const channel = supabase
			.channel(`swot-items-${projectFrameworkId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "swot_items",
					filter: `project_framework_id=eq.${projectFrameworkId}`,
				},
				(payload) => {
					if (payload.eventType === "INSERT") {
						onInsert(payload.new as SwotRealtimeRow);
						return;
					}

					if (payload.eventType === "UPDATE") {
						onUpdate(payload.new as SwotRealtimeRow);
						return;
					}

					if (payload.eventType === "DELETE") {
						onDelete(payload.old as Pick<SwotRealtimeRow, "id" | "project_framework_id">);
					}
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [projectFrameworkId, onDelete, onInsert, onUpdate]);
}
