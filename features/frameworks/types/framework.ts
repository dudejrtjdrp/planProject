export const frameworkKeys = [
  "SWOT",
  "PESTEL",
  "MCKINSEY_7S",
  "MATRIX_2X2",
  "PERSONA_MODEL",
  "COMPETITOR_MAPPING",
] as const;

export type FrameworkKey = (typeof frameworkKeys)[number];

export type FrameworkDbKey =
  | "swot"
  | "pestel"
  | "mckinsey_7s"
  | "matrix_2x2"
  | "persona_model"
  | "competitor_mapping";

export type ProjectFramework = {
  id: string;
  projectId: string;
  frameworkKey: FrameworkKey;
  version: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

const frameworkToDbMap: Record<FrameworkKey, FrameworkDbKey> = {
  SWOT: "swot",
  PESTEL: "pestel",
  MCKINSEY_7S: "mckinsey_7s",
  MATRIX_2X2: "matrix_2x2",
  PERSONA_MODEL: "persona_model",
  COMPETITOR_MAPPING: "competitor_mapping",
};

const dbToFrameworkMap: Record<FrameworkDbKey, FrameworkKey> = {
  swot: "SWOT",
  pestel: "PESTEL",
  mckinsey_7s: "MCKINSEY_7S",
  matrix_2x2: "MATRIX_2X2",
  persona_model: "PERSONA_MODEL",
  competitor_mapping: "COMPETITOR_MAPPING",
};

export function toFrameworkDbKey(frameworkKey: FrameworkKey): FrameworkDbKey {
  return frameworkToDbMap[frameworkKey];
}

export function fromFrameworkDbKey(frameworkDbKey: FrameworkDbKey): FrameworkKey {
  return dbToFrameworkMap[frameworkDbKey];
}
