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
  content: string;
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
