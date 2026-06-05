/**
 * FirstCall — Proprietary and Confidential
 * Copyright © 2026 FirstCall. All rights reserved.
 *
 * This source file embodies confidential trade secrets of FirstCall,
 * including its estimating and cost-modeling methodology. Unauthorized
 * copying, modification, distribution, reverse engineering, or imitation,
 * via any medium, is strictly prohibited. No license is granted except by
 * written agreement. See /LICENSE.
 */
import type { OpTier } from "@firstcall/types";

/** Standard O&P tiers as fractions (overhead, profit). Spec §8. */
export const OP_TIERS: Record<
  Exclude<OpTier, "custom">,
  { overhead: number; profit: number }
> = {
  "10_10": { overhead: 0.1, profit: 0.1 },
  "15_15": { overhead: 0.15, profit: 0.15 },
  "20_20": { overhead: 0.2, profit: 0.2 },
};

const MAX_STANDARD = 0.2;

export type OpGuardrailResult = {
  flagged: boolean;
  reason: string | null;
};

/**
 * Flags O&P that exceeds the standard tiers. A flagged estimate needs an
 * admin override (with reason) or an adjustment, and is quarantined from the
 * learning baseline.
 */
export function checkOpGuardrail(
  tier: OpTier,
  custom?: { overhead: number; profit: number },
): OpGuardrailResult {
  if (tier !== "custom") return { flagged: false, reason: null };
  if (!custom) {
    return { flagged: true, reason: "custom O&P selected with no values" };
  }
  if (custom.overhead > MAX_STANDARD || custom.profit > MAX_STANDARD) {
    return {
      flagged: true,
      reason: `O&P ${Math.round(custom.overhead * 100)}/${Math.round(
        custom.profit * 100,
      )} exceeds standard 20/20 — confirm not excessive`,
    };
  }
  return { flagged: false, reason: null };
}

/** Apply an O&P tier to a raw cost (cents). Returns cents. */
export function applyOp(
  rawCents: number,
  tier: OpTier,
  custom?: { overhead: number; profit: number },
): number {
  const rates =
    tier === "custom"
      ? (custom ?? { overhead: 0, profit: 0 })
      : OP_TIERS[tier];
  const withOverhead = rawCents * (1 + rates.overhead);
  return Math.round(withOverhead * (1 + rates.profit));
}

/**
 * Strip O&P + tax back to raw cost for the learning baseline (spec §3).
 * `markup` is the combined effective multiplier applied on top of raw.
 */
export function stripToRaw(totalCents: number, markup: number): number {
  if (markup <= 0) return totalCents;
  return Math.round(totalCents / (1 + markup));
}
