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
import { splitTotals } from "@firstcall/coverage";
import type {
  CauseOfLoss,
  CoverageBucket,
  OpTier,
} from "@firstcall/types";
import { applyOp, checkOpGuardrail } from "./op";

export * from "./op";

export type EstimateInput = {
  causeOfLoss: CauseOfLoss;
  photos: string[];
  description: string;
  opTier: OpTier;
  customOp?: { overhead: number; profit: number };
};

export type DraftLineItem = {
  code: string;
  description: string;
  qty: number;
  unitPrice: number; // cents
  bucket: CoverageBucket;
};

export type EstimateResult = {
  lineItems: DraftLineItem[];
  rawTotal: number; // cents, pre-O&P
  ballparkTotal: number; // cents, post-O&P
  rangeLow: number;
  rangeHigh: number;
  masterTotal: number;
  ho6Total: number;
  confidence: number; // 0..1
  flagged: boolean;
  flagReason: string | null;
  disclaimer: string;
};

export const BALLPARK_DISCLAIMER =
  "Ballpark only. Scope is confirmed on-site and may change with unforeseen damage. This is not a quote.";

/**
 * Phase 3 will replace the body with the Claude vision+reasoning pipeline
 * (spec §9). This deterministic stub keeps the app working with manual
 * estimates while the AI estimate is feature-flagged off (spec §11).
 */
export function buildEstimate(
  input: EstimateInput,
  lineItems: DraftLineItem[],
): EstimateResult {
  const rawTotal = lineItems.reduce(
    (sum, it) => sum + Math.round(it.unitPrice * it.qty),
    0,
  );

  const ballparkTotal = applyOp(rawTotal, input.opTier, input.customOp);
  const { masterTotal, ho6Total } = splitTotals(lineItems);

  // Confidence degrades with thin photo evidence (spec §6/§9).
  const confidence = input.photos.length >= 4 ? 0.8 : input.photos.length >= 1 ? 0.55 : 0.3;

  const guardrail = checkOpGuardrail(input.opTier, input.customOp);

  return {
    lineItems,
    rawTotal,
    ballparkTotal,
    rangeLow: Math.round(ballparkTotal * 0.85),
    rangeHigh: Math.round(ballparkTotal * 1.25),
    masterTotal,
    ho6Total,
    confidence,
    flagged: guardrail.flagged,
    flagReason: guardrail.reason,
    disclaimer: BALLPARK_DISCLAIMER,
  };
}
