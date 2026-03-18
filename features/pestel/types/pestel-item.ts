export const pestelFactors = [
  "POLITICAL",
  "ECONOMIC",
  "SOCIAL",
  "TECHNOLOGICAL",
  "ENVIRONMENTAL",
  "LEGAL",
] as const;

export type PestelFactor = (typeof pestelFactors)[number];

export type PestelDbFactor =
  | "political"
  | "economic"
  | "social"
  | "technological"
  | "environmental"
  | "legal";

export type PestelItem = {
  id: string;
  projectFrameworkId: string;
  createdBy: string | null;
  factor: PestelFactor;
  title: string;
  description: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const pestelFactorToDbMap: Record<PestelFactor, PestelDbFactor> = {
  POLITICAL: "political",
  ECONOMIC: "economic",
  SOCIAL: "social",
  TECHNOLOGICAL: "technological",
  ENVIRONMENTAL: "environmental",
  LEGAL: "legal",
};

const pestelDbToFactorMap: Record<PestelDbFactor, PestelFactor> = {
  political: "POLITICAL",
  economic: "ECONOMIC",
  social: "SOCIAL",
  technological: "TECHNOLOGICAL",
  environmental: "ENVIRONMENTAL",
  legal: "LEGAL",
};

export function toPestelDbFactor(factor: PestelFactor): PestelDbFactor {
  return pestelFactorToDbMap[factor];
}

export function fromPestelDbFactor(factor: PestelDbFactor): PestelFactor {
  return pestelDbToFactorMap[factor];
}

export function parsePestelContent(content: string): { title: string; description: string } {
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

export function stringifyPestelContent(title: string, description: string): string {
  return JSON.stringify({ title: title.trim(), description: description.trim() });
}
