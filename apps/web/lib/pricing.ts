import "server-only";
import { db, schema } from "@firstcall/db";
import { and, eq, ilike, or } from "drizzle-orm";
import type { CauseOfLoss } from "@firstcall/types";
import {
  AREA_LINES,
  CAUSE_SCOPE,
  type GeneratedItem,
  type ScopeLine,
} from "@/lib/estimate";
import { AREA_RECIPES, CAUSE_RECIPES, type Recipe } from "@/lib/recipes";

/**
 * Grounds generated estimate lines on real cost data. For each scope/area line:
 *   1. T&M anchor — price the recipe bundle (labor·hours + equipment·days +
 *      materials·qty) from `cost_basis_items` (read via the service role; raw
 *      rates never leave the server).
 *   2. XA anchor — keyword-match `price_list_items`, take the median matched
 *      unit price scaled to the line, then GUARD it against the trusted T&M
 *      cost. The XA export has corrupt equipment outliers, so any anchor that
 *      diverges more than XA_GUARD× from T&M is rejected.
 *   3. Median — blend the surviving anchors (mean of two) into the line price.
 *      "For now, until the database learns" this median is the quote basis.
 */

const XA_GUARD = 4; // reject XA anchors >4× or <¼× the trusted T&M cost

type CostMap = Map<string, number>; // cost_basis_items.name -> standardRate (cents)

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

async function loadCostBasis(tenantId: string): Promise<CostMap> {
  const rows = await db
    .select({
      name: schema.costBasisItems.name,
      rate: schema.costBasisItems.standardRate,
    })
    .from(schema.costBasisItems)
    .where(eq(schema.costBasisItems.tenantId, tenantId));
  const map: CostMap = new Map();
  for (const r of rows) if (!map.has(r.name)) map.set(r.name, r.rate);
  return map;
}

type TmBreakdown = {
  laborCost: number;
  equipmentCost: number;
  materialCost: number;
  hours: number;
  missing: string[];
};

/** Price a recipe bundle from the cost basis (all integer cents, per occurrence). */
function priceRecipe(recipe: Recipe, costs: CostMap): TmBreakdown {
  const missing: string[] = [];
  const rate = (name: string): number => {
    const r = costs.get(name);
    if (r === undefined) {
      missing.push(name);
      return 0;
    }
    return r;
  };
  const laborCost = recipe.labor.reduce(
    (s, l) => s + Math.round(l.hours * rate(l.role)),
    0,
  );
  const equipmentCost = recipe.equipment.reduce(
    (s, e) => s + Math.round(e.days * rate(e.name)),
    0,
  );
  const materialCost = recipe.materials.reduce(
    (s, m) => s + Math.round(m.qty * rate(m.name)),
    0,
  );
  const hours = recipe.labor.reduce((s, l) => s + l.hours, 0);
  return { laborCost, equipmentCost, materialCost, hours, missing };
}

/** Median matched XA unit price (cents) for a line's keywords, or null. */
async function xaUnitMedian(
  tenantId: string,
  keywords: string[],
): Promise<number | null> {
  const clauses = keywords.map((k) =>
    ilike(schema.priceListItems.description, `%${k}%`),
  );
  const rows = await db
    .select({ price: schema.priceListItems.unitPrice })
    .from(schema.priceListItems)
    .where(and(eq(schema.priceListItems.tenantId, tenantId), or(...clauses)))
    .limit(400);
  return median(rows.map((r) => r.price));
}

export type GroundedEstimate = {
  items: GeneratedItem[];
  timeline: { min: number; expected: number; max: number };
  warnings: string[];
};

/**
 * Build grounded line items for the generation inputs. Falls back to the
 * synthetic price (ScopeLine.raw) for any line whose recipe can't be priced
 * (e.g. tenant cost basis not loaded), recording a warning.
 */
export async function buildGroundedEstimate(
  input: { cause: CauseOfLoss; areas: string[] },
  tenantId: string,
): Promise<GroundedEstimate> {
  const costs = await loadCostBasis(tenantId);
  const nAreas = Math.max(1, input.areas.length);
  const scope = CAUSE_SCOPE[input.cause] ?? CAUSE_SCOPE.other;
  const recipes = CAUSE_RECIPES[input.cause] ?? CAUSE_RECIPES.other;

  const items: GeneratedItem[] = [];
  const warnings: string[] = [];
  const timeline = { min: 0, expected: 0, max: 0 };

  const ground = async (
    code: string,
    description: string,
    bucket: ScopeLine["bucket"],
    qty: number,
    fallbackRaw: number,
    recipe: Recipe | undefined,
    note?: string,
  ) => {
    if (!recipe || costs.size === 0) {
      items.push({
        code,
        description,
        qty,
        unitPrice: Math.round(fallbackRaw * 100),
        bucket,
        note,
        laborCost: 0,
        equipmentCost: 0,
        materialCost: 0,
        hours: 0,
        xaUnitPrice: null,
      });
      if (costs.size === 0)
        warnings.push("No T&M cost basis loaded — using synthetic prices.");
      return;
    }

    const tm = priceRecipe(recipe, costs);
    if (tm.missing.length) {
      warnings.push(
        `${code}: missing cost item(s) ${[...new Set(tm.missing)].join(", ")}`,
      );
    }
    const tmCost = tm.laborCost + tm.equipmentCost + tm.materialCost;

    // XA anchor, guarded against the trusted T&M cost.
    const xaUnit = await xaUnitMedian(tenantId, recipe.xa.keywords);
    let xaAnchor: number | null = null;
    let xaUnitForDisplay: number | null = null;
    if (xaUnit !== null && tmCost > 0) {
      const candidate = Math.round(xaUnit * recipe.xa.unitQty);
      const withinGuard =
        candidate <= tmCost * XA_GUARD && candidate >= tmCost / XA_GUARD;
      if (withinGuard) {
        xaAnchor = candidate;
        xaUnitForDisplay = xaUnit;
      } else {
        warnings.push(
          `${code}: XA anchor rejected (outlier vs T&M) — using T&M only.`,
        );
      }
    }

    // Median = mean of the surviving anchors.
    const unitPrice =
      xaAnchor !== null ? Math.round((tmCost + xaAnchor) / 2) : tmCost;

    items.push({
      code,
      description,
      qty,
      unitPrice,
      bucket,
      note,
      laborCost: tm.laborCost,
      equipmentCost: tm.equipmentCost,
      materialCost: tm.materialCost,
      hours: tm.hours,
      xaUnitPrice: xaUnitForDisplay,
    });

    timeline.min += recipe.durationDays.min * qty;
    timeline.expected += recipe.durationDays.expected * qty;
    timeline.max += recipe.durationDays.max * qty;
  };

  for (const s of scope) {
    const qty = s.perArea ? nAreas : 1;
    await ground(s.code, s.label, s.bucket, qty, s.raw, recipes[s.code], s.note);
  }
  for (const aid of input.areas) {
    const lines = AREA_LINES[aid];
    if (!lines) continue;
    for (const it of lines) {
      await ground(it.code, it.label, it.bucket, 1, it.raw, AREA_RECIPES[it.code]);
    }
  }

  return { items, timeline, warnings: [...new Set(warnings)] };
}
