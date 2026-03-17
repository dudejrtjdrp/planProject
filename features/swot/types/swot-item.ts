export const swotTypes = ["STRENGTH", "WEAKNESS", "OPPORTUNITY", "THREAT"] as const;

export type SwotType = (typeof swotTypes)[number];

export type SwotDbQuadrant = "strength" | "weakness" | "opportunity" | "threat";

export type SwotItem = {
  id: string;
  projectFrameworkId: string;
  createdBy: string | null;
  type: SwotType;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

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
