import "server-only";
import type { CauseOfLoss, CoverageBucket, OpTier } from "@firstcall/types";

/**
 * FirstCall ballpark estimate engine (ports the design-handoff prototype's
 * estimate.jsx to the server, in integer cents). Raw labor+materials+equipment
 * is assembled per cause-of-loss and per affected area; the tenant O&P tier is
 * applied on top to produce master/HO6 totals and a ballpark.
 *
 * All `raw` values here are dollars for readability — converted to cents at the
 * boundary by `buildEstimateItems`. Numbers are illustrative, never a quote.
 */

export type GeneratedItem = {
  code: string;
  description: string;
  qty: number;
  unitPrice: number; // integer cents — grounded median (T&M blended with XA)
  bucket: CoverageBucket;
  note?: string;
  // Per-unit grounded breakdown (cents). Defaults to 0 on the synthetic
  // fallback path (tenant has no T&M cost basis loaded).
  laborCost: number;
  equipmentCost: number;
  materialCost: number;
  hours: number;
  xaUnitPrice: number | null; // matched XA anchor (null if none/rejected)
};

export const ESTIMATE_AREAS: { id: string; label: string }[] = [
  { id: "kitchen", label: "Kitchen" },
  { id: "bath", label: "Bathroom" },
  { id: "bedroom", label: "Bedroom" },
  { id: "living", label: "Living room" },
  { id: "ceiling", label: "Ceilings" },
  { id: "flooring", label: "Flooring" },
];

export const ESTIMATE_CAUSES: { id: CauseOfLoss; label: string }[] = [
  { id: "water", label: "Water" },
  { id: "fire", label: "Fire" },
  { id: "mold", label: "Mold" },
  { id: "storm", label: "Storm" },
  { id: "other", label: "Other" },
];

export type ScopeLine = {
  code: string;
  label: string;
  raw: number; // dollars — synthetic fallback only; real price comes from grounding
  perArea: boolean;
  bucket: CoverageBucket;
  note?: string;
};

export const CAUSE_SCOPE: Record<CauseOfLoss, ScopeLine[]> = {
  water: [
    { code: "WTR-EXT", label: "Emergency water extraction", raw: 460, perArea: true, bucket: "master" },
    { code: "WTR-DRY", label: "Structural drying — air movers + dehu", raw: 720, perArea: false, bucket: "master", note: "3 drying days · IICRC S500" },
    { code: "WTR-AMB", label: "Antimicrobial application", raw: 190, perArea: true, bucket: "master" },
    { code: "WTR-FLC", label: "Drywall flood-cut & removal", raw: 280, perArea: true, bucket: "master" },
  ],
  fire: [
    { code: "FIR-SOOT", label: "Soot & smoke surface cleaning", raw: 540, perArea: true, bucket: "master" },
    { code: "FIR-FOG", label: "Thermal fogging & deodorization", raw: 430, perArea: false, bucket: "master" },
    { code: "FIR-PACK", label: "Contents pack-out & cleaning", raw: 610, perArea: false, bucket: "ho6" },
    { code: "FIR-CHAR", label: "Charred drywall & insulation removal", raw: 320, perArea: true, bucket: "master" },
  ],
  mold: [
    { code: "MLD-CONT", label: "Containment & negative air setup", raw: 480, perArea: false, bucket: "master", note: "IICRC S520" },
    { code: "MLD-HEPA", label: "HEPA air scrubbing", raw: 360, perArea: false, bucket: "master" },
    { code: "MLD-REM", label: "Mold remediation & removal", raw: 410, perArea: true, bucket: "master" },
    { code: "MLD-ENC", label: "Antimicrobial / encapsulation", raw: 220, perArea: true, bucket: "master" },
  ],
  storm: [
    { code: "STM-BRD", label: "Emergency board-up & roof tarp", raw: 560, perArea: false, bucket: "master" },
    { code: "STM-DEB", label: "Debris removal & haul-off", raw: 340, perArea: false, bucket: "master" },
    { code: "STM-MIT", label: "Water mitigation & drying", raw: 620, perArea: true, bucket: "master" },
    { code: "STM-DRY", label: "Structural drywall removal", raw: 290, perArea: true, bucket: "master" },
  ],
  other: [
    { code: "OTH-ASMT", label: "On-site assessment & make-safe", raw: 380, perArea: false, bucket: "master" },
    { code: "OTH-LAB", label: "General mitigation labor", raw: 300, perArea: true, bucket: "master" },
  ],
};

export const AREA_LINES: Record<string, { code: string; label: string; raw: number; bucket: CoverageBucket }[]> = {
  kitchen: [
    { code: "KIT-CAB", label: "Cabinet & countertop restoration", raw: 980, bucket: "ho6" },
    { code: "KIT-FLR", label: "Kitchen flooring replacement", raw: 640, bucket: "ho6" },
  ],
  bath: [{ code: "BTH-TILE", label: "Tile & fixture restoration", raw: 720, bucket: "ho6" }],
  bedroom: [
    { code: "BED-CRP", label: "Carpet & pad replacement", raw: 520, bucket: "ho6" },
    { code: "BED-PNT", label: "Repaint walls & trim", raw: 360, bucket: "ho6" },
  ],
  living: [
    { code: "LIV-FLR", label: "Flooring refinish", raw: 600, bucket: "ho6" },
    { code: "LIV-PNT", label: "Repaint walls & trim", raw: 420, bucket: "ho6" },
  ],
  ceiling: [{ code: "CLG-DRY", label: "Ceiling drywall & texture", raw: 470, bucket: "master" }],
  flooring: [{ code: "FLR-SUB", label: "Subfloor drying & treatment", raw: 540, bucket: "master" }],
};

/** O&P standard tiers → overhead/profit percentages. `custom` is anything else. */
export const OP_TIERS: { tier: Exclude<OpTier, "custom">; oh: number; profit: number }[] = [
  { tier: "10_10", oh: 10, profit: 10 },
  { tier: "15_15", oh: 15, profit: 15 },
  { tier: "20_20", oh: 20, profit: 20 },
];

export function opTierFor(oh: number, profit: number): OpTier {
  const match = OP_TIERS.find((t) => t.oh === oh && t.profit === profit);
  return match ? match.tier : "custom";
}

export function opPctsFor(tier: OpTier): { oh: number; profit: number } {
  const match = OP_TIERS.find((t) => t.tier === tier);
  return match ? { oh: match.oh, profit: match.profit } : { oh: 10, profit: 10 };
}

/** Confidence as a 0–1 score derived from photo count, plus a display label. */
export function confidenceScore(photoCount: number): number {
  return photoCount >= 5 ? 0.9 : photoCount >= 2 ? 0.7 : 0.5;
}

export function confidenceLabel(score: number | null | undefined): "High" | "Medium" | "Low" {
  if (score == null) return "Low";
  return score >= 0.85 ? "High" : score >= 0.65 ? "Medium" : "Low";
}

/** Evidence-only range half-width as a fraction of the ballpark. */
export function confidenceBand(label: "High" | "Medium" | "Low"): number {
  return label === "High" ? 0.1 : label === "Medium" ? 0.16 : 0.24;
}

/**
 * Combined range half-width: evidence confidence PLUS timeline spread. A job
 * whose duration is uncertain (wide min→max) widens the band on top of the
 * evidence band. Capped so the range stays presentable.
 */
export function combinedBand(
  label: "High" | "Medium" | "Low",
  timeline: { min: number; expected: number; max: number },
): number {
  const evidence = confidenceBand(label);
  const spread =
    timeline.expected > 0
      ? (timeline.max - timeline.min) / (2 * timeline.expected)
      : 0;
  return Math.min(0.45, evidence + spread);
}

/**
 * Synthetic fallback builder (integer cents) used only when the tenant has no
 * T&M cost basis loaded. The grounded path lives in lib/pricing.ts; this keeps
 * generation working (with placeholder prices and a zeroed breakdown) so the
 * product never hard-fails on an unseeded tenant.
 */
export function buildEstimateItems(input: {
  cause: CauseOfLoss;
  areas: string[];
  photoCount: number;
}): GeneratedItem[] {
  const nAreas = Math.max(1, input.areas.length);
  const scope = CAUSE_SCOPE[input.cause] ?? CAUSE_SCOPE.other;
  const items: GeneratedItem[] = [];

  const blank = {
    laborCost: 0,
    equipmentCost: 0,
    materialCost: 0,
    hours: 0,
    xaUnitPrice: null,
  };

  for (const s of scope) {
    const qty = s.perArea ? nAreas : 1;
    items.push({
      code: s.code,
      description: s.label,
      qty,
      unitPrice: Math.round(s.raw * 100),
      bucket: s.bucket,
      note: s.note,
      ...blank,
    });
  }

  for (const aid of input.areas) {
    const lines = AREA_LINES[aid];
    if (!lines) continue;
    for (const it of lines) {
      items.push({
        code: it.code,
        description: it.label,
        qty: 1,
        unitPrice: Math.round(it.raw * 100),
        bucket: it.bucket,
        ...blank,
      });
    }
  }

  return items;
}

export type EstimateTotals = {
  rawMaster: number;
  rawHo6: number;
  raw: number;
  masterTotal: number;
  ho6Total: number;
  ballparkTotal: number;
  flagged: boolean;
};

/** Apply O&P to per-bucket raw subtotals (all integer cents). */
export function computeTotals(
  items: { qty: number; unitPrice: number; bucket: CoverageBucket }[],
  oh: number,
  profit: number,
): EstimateTotals {
  const rawMaster = items
    .filter((i) => i.bucket === "master")
    .reduce((s, i) => s + Math.round(i.qty * i.unitPrice), 0);
  const rawHo6 = items
    .filter((i) => i.bucket === "ho6")
    .reduce((s, i) => s + Math.round(i.qty * i.unitPrice), 0);
  const raw = rawMaster + rawHo6;
  const rate = (oh + profit) / 100;
  return {
    rawMaster,
    rawHo6,
    raw,
    masterTotal: Math.round(rawMaster * (1 + rate)),
    ho6Total: Math.round(rawHo6 * (1 + rate)),
    ballparkTotal: Math.round(raw * (1 + rate)),
    flagged: oh > 20 || profit > 20,
  };
}
