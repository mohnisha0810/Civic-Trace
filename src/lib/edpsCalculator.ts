import { ComplaintCategory, PriorityBand } from '../types';

export interface EdpsCalculationInput {
  category: ComplaintCategory;
  visualHazard?: number;    // VH: 0-100 (30% weight)
  zoneSensitivity?: number; // ZW: 0-100 (25% weight)
  upvotes?: number;        // Used to compute CV (20% weight)
  civicEquity?: number;    // EQ: 0-100 (15% weight)
  slaEscalator?: number;   // SLA: 0-100 (10% weight)
  proximityDetail?: string;
}

export interface EdpsCalculationResult {
  score: number;
  band: PriorityBand;
  explanation: string;
  factors: {
    visualHazard: number;
    zoneSensitivity: number;
    clusterVelocity: number;
    civicEquity: number;
    slaEscalator: number;
  };
}

export const CATEGORY_BASE_HAZARD: Record<ComplaintCategory, number> = {
  road_damage: 88,
  drainage_sewage: 84,
  streetlight_electrical: 90,
  water_supply: 82,
  traffic_signals: 85,
  garbage_waste: 68,
  public_infrastructure: 72,
  other: 55,
};

export function getPriorityBand(score: number): PriorityBand {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function calculateClusterVelocity(upvotes: number = 0): number {
  return Math.min(100, Math.max(0, 30 + 12 * upvotes));
}

/**
 * Computes Explainable Dynamic Priority Scoring (EDPS)
 */
export function calculateEdps(input: EdpsCalculationInput): EdpsCalculationResult {
  const vh = input.visualHazard !== undefined
    ? Math.min(100, Math.max(0, input.visualHazard))
    : (CATEGORY_BASE_HAZARD[input.category] || 70);

  const zw = input.zoneSensitivity !== undefined
    ? Math.min(100, Math.max(0, input.zoneSensitivity))
    : 75; // Baseline standard zone

  const cv = calculateClusterVelocity(input.upvotes ?? 0);
  const eq = input.civicEquity !== undefined ? input.civicEquity : 70;
  const sla = input.slaEscalator !== undefined ? input.slaEscalator : 60;

  // Formula: 0.30*VH + 0.25*ZW + 0.20*CV + 0.15*EQ + 0.10*SLA
  const rawScore = 0.30 * vh + 0.25 * zw + 0.20 * cv + 0.15 * eq + 0.10 * sla;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const band = getPriorityBand(score);

  const categoryName = input.category.replace(/_/g, ' ');
  const proximityText = input.proximityDetail || 'municipal sector';

  const explanation = `Prioritized at Score ${score} (${band.toUpperCase()}) based on ${categoryName} visual hazard depth (${vh}/100), proximity kernel to ${proximityText} (${zw}/100), crowd velocity signal (${cv}/100 from ${input.upvotes ?? 0} upvotes), and demographic ward equity balance (${eq}/100).`;

  return {
    score,
    band,
    explanation,
    factors: {
      visualHazard: vh,
      zoneSensitivity: zw,
      clusterVelocity: cv,
      civicEquity: eq,
      slaEscalator: sla,
    },
  };
}
