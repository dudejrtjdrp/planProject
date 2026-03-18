export const swotTypes = ["STRENGTH", "WEAKNESS", "OPPORTUNITY", "THREAT"] as const;
export type SwotType = (typeof swotTypes)[number];

export type SwotDbQuadrant = "strength" | "weakness" | "opportunity" | "threat";

export type SwotItem = {
	id: string;
	projectFrameworkId: string;
	createdBy: string | null;
	type: SwotType;
	title: string;
	description: string;
	content: string;
	position: number;
	createdAt: string;
	updatedAt: string;
};

export function parseSwotContent(content: string): { title: string; description: string } {
	const normalized = content.trim();
	if (!normalized) {
		return { title: "", description: "" };
	}

	try {
		const parsed = JSON.parse(normalized) as { title?: unknown; description?: unknown };
		if (parsed && typeof parsed === "object") {
			const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
			const description = typeof parsed.description === "string" ? parsed.description.trim() : "";
			if (title || description) {
				return { title, description };
			}
		}
	} catch {
	}

	const lines = normalized
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length <= 1) {
		return { title: "", description: lines[0] ?? "" };
	}

	return {
		title: lines[0],
		description: lines.slice(1).join("\n"),
	};
}

export function stringifySwotContent(title: string, description: string): string {
	return JSON.stringify({ title: title.trim(), description: description.trim() });
}

const swotTypeToDbMap: Record<SwotType, SwotDbQuadrant> = {
	STRENGTH: "strength",
	WEAKNESS: "weakness",
	OPPORTUNITY: "opportunity",
	THREAT: "threat",
};

const swotDbToTypeMap: Record<SwotDbQuadrant, SwotType> = {
	strength: "STRENGTH",
	weakness: "WEAKNESS",
	opportunity: "OPPORTUNITY",
	threat: "THREAT",
};

export function toSwotDbQuadrant(type: SwotType): SwotDbQuadrant {
	return swotTypeToDbMap[type];
}

export function fromSwotDbQuadrant(quadrant: SwotDbQuadrant): SwotType {
	return swotDbToTypeMap[quadrant];
}
