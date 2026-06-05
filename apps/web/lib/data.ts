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
import "server-only";
import { db, schema, withTenant, type AppDb } from "@firstcall/db";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  CauseOfLoss,
  CoverageBucket,
  JobStatus,
  OwnerRole,
} from "@firstcall/types";
import { requireSession, type SessionContext } from "@/lib/auth";
import {
  combinedBand,
  computeTotals,
  confidenceLabel,
  confidenceScore,
  opTierFor,
  type GeneratedItem,
} from "@/lib/estimate";
import { buildGroundedEstimate } from "@/lib/pricing";

/**
 * Market tag for the learning dataset. There is no per-tenant market field yet;
 * until one exists, generated jobs are tagged with the seed market so the
 * estimated-vs-actual ledger stays queryable alongside the onboarding rows.
 */
const DEFAULT_MARKET = "CA-San Diego";

/** Sum a grounded estimate's per-unit breakdown into O&P-stripped raw totals. */
function summarizeBreakdown(items: GeneratedItem[]) {
  let rawLabor = 0;
  let rawEquipment = 0;
  let rawMaterials = 0;
  let laborHours = 0;
  for (const it of items) {
    rawLabor += Math.round(it.laborCost * it.qty);
    rawEquipment += Math.round(it.equipmentCost * it.qty);
    rawMaterials += Math.round(it.materialCost * it.qty);
    laborHours += it.hours * it.qty;
  }
  return { rawLabor, rawEquipment, rawMaterials, laborHours };
}

/** Tenant display name for the current session (shell chrome). */
export async function getTenantName(): Promise<string> {
  const ctx = await requireSession();
  const [row] = await db
    .select({ name: schema.tenants.name })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, ctx.tenantId))
    .limit(1);
  return row?.name ?? "Workspace";
}

/**
 * All tenant-facing reads/writes go through `scoped`: it resolves the tenant
 * server-side from the session and runs inside withTenant (RLS GUC bound).
 * The explicit tenant filters in each query are belt-and-suspenders on top of
 * the RLS backstop (spec §11).
 */
export async function scoped<T>(
  fn: (tx: AppDb, ctx: SessionContext) => Promise<T>,
): Promise<T> {
  const ctx = await requireSession();
  return withTenant(ctx.tenantId, (tx) => fn(tx, ctx));
}

/* ---------------------------------------------------------- properties */

export function listProperties() {
  return scoped((tx, ctx) =>
    tx
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.tenantId, ctx.tenantId))
      .orderBy(asc(schema.properties.name)),
  );
}

export function getProperty(id: string) {
  return scoped(async (tx, ctx) => {
    const [property] = await tx
      .select()
      .from(schema.properties)
      .where(
        and(
          eq(schema.properties.id, id),
          eq(schema.properties.tenantId, ctx.tenantId),
        ),
      )
      .limit(1);
    if (!property) return null;

    const units = await tx
      .select()
      .from(schema.units)
      .where(eq(schema.units.propertyId, id))
      .orderBy(asc(schema.units.unitNumber));

    return { property, units };
  });
}

export function createProperty(input: {
  name: string;
  address: string;
  type: "condo" | "single" | "commercial";
}) {
  return scoped(async (tx, ctx) => {
    const [row] = await tx
      .insert(schema.properties)
      .values({ ...input, tenantId: ctx.tenantId })
      .returning();
    return row;
  });
}

/* --------------------------------------------------------------- units */

export function createUnit(input: {
  propertyId: string;
  unitNumber: string;
  ho6Status: "verified" | "pending" | "none";
}) {
  return scoped(async (tx) => {
    // RLS confirms the property belongs to the caller's tenant; the insert is
    // rejected by WITH CHECK otherwise.
    const [row] = await tx.insert(schema.units).values(input).returning();
    return row;
  });
}

export function setUnitHo6(
  unitId: string,
  ho6Status: "verified" | "pending" | "none",
) {
  return scoped(async (tx) => {
    const [row] = await tx
      .update(schema.units)
      .set({ ho6Status, updatedAt: new Date() })
      .where(eq(schema.units.id, unitId))
      .returning();
    return row;
  });
}

/* -------------------------------------------------------------- owners */

export function listOwners() {
  return scoped((tx, ctx) =>
    tx
      .select()
      .from(schema.owners)
      .where(eq(schema.owners.tenantId, ctx.tenantId))
      .orderBy(desc(schema.owners.createdAt)),
  );
}

export function createOwner(input: {
  name: string;
  contact: string;
  role: "hoa" | "unit_owner" | "tenant";
}) {
  return scoped(async (tx, ctx) => {
    const [row] = await tx
      .insert(schema.owners)
      .values({ ...input, tenantId: ctx.tenantId })
      .returning();
    return row;
  });
}

/* ---------------------------------------------------------- price list */

export type PriceListRow = {
  code: string;
  description: string;
  iicrcCategory: string | null;
  unit: string;
  unitPrice: number; // integer cents
};

/** Per-tenant T&M item count (decision: never a hardcoded global constant). */
export function countPriceListItems(): Promise<number> {
  return scoped(async (tx, ctx) => {
    const [row] = await tx
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.priceListItems)
      .where(eq(schema.priceListItems.tenantId, ctx.tenantId));
    return row?.c ?? 0;
  });
}

export function listPriceListItems(limit = 50) {
  return scoped((tx, ctx) =>
    tx
      .select()
      .from(schema.priceListItems)
      .where(eq(schema.priceListItems.tenantId, ctx.tenantId))
      .orderBy(asc(schema.priceListItems.code))
      .limit(limit),
  );
}

export type PriceListItem = typeof schema.priceListItems.$inferSelect;

export type PriceListPage = {
  items: PriceListItem[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

export const PRICE_LIST_PAGE_SIZE = 100;

/**
 * A single page of the tenant's price list, optionally filtered by a free-text
 * query (matched against code, description, or category). Returns the filtered
 * total so the UI can paginate the *entire* catalog, not just the first N rows.
 */
export function listPriceListItemsPage(opts: {
  q?: string;
  page?: number;
}): Promise<PriceListPage> {
  const pageSize = PRICE_LIST_PAGE_SIZE;
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  return scoped(async (tx, ctx) => {
    const q = opts.q?.trim();
    const filter = q
      ? and(
          eq(schema.priceListItems.tenantId, ctx.tenantId),
          or(
            ilike(schema.priceListItems.code, `%${q}%`),
            ilike(schema.priceListItems.description, `%${q}%`),
            ilike(schema.priceListItems.iicrcCategory, `%${q}%`),
          ),
        )
      : eq(schema.priceListItems.tenantId, ctx.tenantId);

    const [[cnt], rows] = await Promise.all([
      tx
        .select({ c: sql<number>`count(*)::int` })
        .from(schema.priceListItems)
        .where(filter),
      tx
        .select()
        .from(schema.priceListItems)
        .where(filter)
        .orderBy(asc(schema.priceListItems.code))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = cnt?.c ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return { items: rows, total, page, pageCount, pageSize };
  });
}

/**
 * Update a single price-list row for the caller's tenant. `code` is the
 * estimate join key and stays immutable here; callers edit the descriptive
 * fields and price. Tenant-scoped (defence-in-depth on top of RLS) so one
 * tenant can never mutate another's catalog by guessing an id.
 */
export function updatePriceListItem(
  id: string,
  fields: {
    description: string;
    iicrcCategory: string | null;
    unit: string;
    unitPrice: number;
  },
): Promise<void> {
  return scoped(async (tx, ctx) => {
    await tx
      .update(schema.priceListItems)
      .set({ ...fields, updatedAt: new Date() })
      .where(
        and(
          eq(schema.priceListItems.id, id),
          eq(schema.priceListItems.tenantId, ctx.tenantId),
        ),
      );
  });
}

/**
 * Bulk upsert price-list rows for the caller's tenant, deduping on `code`
 * (last value wins, both within the batch and against existing rows).
 * Inserts are batched to stay under Postgres' parameter ceiling.
 */
export function importPriceListItems(
  rows: PriceListRow[],
): Promise<{ total: number }> {
  return scoped(async (tx, ctx) => {
    // Dedupe within the file: last occurrence of a code wins.
    const byCode = new Map<string, PriceListRow>();
    for (const r of rows) byCode.set(r.code, r);
    const deduped = [...byCode.values()];

    const BATCH = 500;
    for (let i = 0; i < deduped.length; i += BATCH) {
      const chunk = deduped.slice(i, i + BATCH).map((r) => ({
        ...r,
        tenantId: ctx.tenantId,
      }));
      await tx
        .insert(schema.priceListItems)
        .values(chunk)
        .onConflictDoUpdate({
          target: [
            schema.priceListItems.tenantId,
            schema.priceListItems.code,
          ],
          set: {
            description: sql`excluded.description`,
            iicrcCategory: sql`excluded.iicrc_category`,
            unit: sql`excluded.unit`,
            unitPrice: sql`excluded.unit_price`,
            updatedAt: new Date(),
          },
        });
    }
    return { total: deduped.length };
  });
}

/* ------------------------------------------------------ claims / estimates */

export type BoardClaim = {
  id: string;
  unitNumber: string | null;
  ownerName: string | null;
  cause: CauseOfLoss;
  status: JobStatus;
  ho6Status: "verified" | "pending" | "none" | null;
  ballparkTotal: number | null;
};

/** Dispatch-board feed: every claim + its latest estimate's ballpark (cents). */
export function listClaimsForBoard(): Promise<BoardClaim[]> {
  return scoped(async (tx, ctx) => {
    const rows = await tx
      .select({
        id: schema.claims.id,
        status: schema.claims.status,
        cause: schema.claims.causeOfLoss,
        unitNumber: schema.units.unitNumber,
        ho6Status: schema.units.ho6Status,
        ownerName: schema.owners.name,
      })
      .from(schema.claims)
      .leftJoin(schema.units, eq(schema.units.id, schema.claims.unitId))
      .leftJoin(schema.owners, eq(schema.owners.id, schema.units.ownerId))
      .where(eq(schema.claims.tenantId, ctx.tenantId))
      .orderBy(desc(schema.claims.createdAt));

    const ests = await tx
      .select({
        claimId: schema.estimates.claimId,
        ballparkTotal: schema.estimates.ballparkTotal,
      })
      .from(schema.estimates)
      .orderBy(desc(schema.estimates.createdAt));
    const latest = new Map<string, number>();
    for (const e of ests) if (!latest.has(e.claimId)) latest.set(e.claimId, e.ballparkTotal);

    return rows.map((r) => ({
      ...r,
      ballparkTotal: latest.get(r.id) ?? null,
    }));
  });
}

export type DispatchMetrics = {
  captureRatio: number | null;
  pipelineValue: number;
  totalClaims: number;
};

const ACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "new",
  "dispatched",
  "on_site",
  "estimate",
]);

/** Capture ratio (signed ÷ decided) + open-pipeline value from latest estimates. */
export function getDispatchMetrics(): Promise<DispatchMetrics> {
  return scoped(async (tx, ctx) => {
    const claimRows = await tx
      .select({ status: schema.claims.status })
      .from(schema.claims)
      .where(eq(schema.claims.tenantId, ctx.tenantId));
    const signed = claimRows.filter(
      (r) => r.status === "signed" || r.status === "complete",
    ).length;
    const lost = claimRows.filter((r) => r.status === "lost").length;
    const decided = signed + lost;

    const ests = await tx
      .select({
        claimId: schema.estimates.claimId,
        ballparkTotal: schema.estimates.ballparkTotal,
        status: schema.claims.status,
      })
      .from(schema.estimates)
      .innerJoin(schema.claims, eq(schema.claims.id, schema.estimates.claimId))
      .where(eq(schema.claims.tenantId, ctx.tenantId))
      .orderBy(desc(schema.estimates.createdAt));
    const seen = new Set<string>();
    let pipelineValue = 0;
    for (const e of ests) {
      if (seen.has(e.claimId)) continue;
      seen.add(e.claimId);
      if (ACTIVE_STATUSES.has(e.status)) pipelineValue += e.ballparkTotal;
    }

    return {
      captureRatio: decided > 0 ? Math.round((signed / decided) * 100) : null,
      pipelineValue,
      totalClaims: claimRows.length,
    };
  });
}

export function setClaimStatus(claimId: string, status: JobStatus) {
  return scoped(async (tx, ctx) => {
    const [row] = await tx
      .update(schema.claims)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(schema.claims.id, claimId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .returning();
    return row ?? null;
  });
}

export type ClaimForEstimate = NonNullable<
  Awaited<ReturnType<typeof getClaimForEstimate>>
>;

/** Claim header + its latest estimate (with line items) for the editor. */
export function getClaimForEstimate(claimId: string) {
  return scoped(async (tx, ctx) => {
    const [claim] = await tx
      .select({
        id: schema.claims.id,
        cause: schema.claims.causeOfLoss,
        status: schema.claims.status,
        description: schema.claims.description,
        photos: schema.claims.photos,
        ownerRole: schema.claims.ownerRole,
        unitNumber: schema.units.unitNumber,
        ho6Status: schema.units.ho6Status,
        propertyName: schema.properties.name,
      })
      .from(schema.claims)
      .leftJoin(schema.units, eq(schema.units.id, schema.claims.unitId))
      .leftJoin(
        schema.properties,
        eq(schema.properties.id, schema.units.propertyId),
      )
      .where(
        and(
          eq(schema.claims.id, claimId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .limit(1);
    if (!claim) return null;

    const [estimate] = await tx
      .select()
      .from(schema.estimates)
      .where(eq(schema.estimates.claimId, claimId))
      .orderBy(desc(schema.estimates.createdAt))
      .limit(1);

    const lineItems = estimate
      ? await tx
          .select()
          .from(schema.estimateLineItems)
          .where(eq(schema.estimateLineItems.estimateId, estimate.id))
          .orderBy(asc(schema.estimateLineItems.sortOrder))
      : [];

    // Learning row (estimated breakdown captured at generation + actuals once
    // the job closes) — drives the estimated-vs-actual panel in the editor.
    const [learning] = await tx
      .select({
        rawLabor: schema.historicalJobs.rawLabor,
        rawMaterials: schema.historicalJobs.rawMaterials,
        rawEquipment: schema.historicalJobs.rawEquipment,
        estLaborHours: schema.historicalJobs.estLaborHours,
        actualLabor: schema.historicalJobs.actualLabor,
        actualMaterials: schema.historicalJobs.actualMaterials,
        actualEquipment: schema.historicalJobs.actualEquipment,
        actualHours: schema.historicalJobs.actualHours,
      })
      .from(schema.historicalJobs)
      .where(eq(schema.historicalJobs.claimId, claimId))
      .orderBy(desc(schema.historicalJobs.createdAt))
      .limit(1);

    return { claim, estimate: estimate ?? null, lineItems, learning: learning ?? null };
  });
}

/**
 * Job close: record the actual labor/materials/equipment cost (and hours) for a
 * completed claim against its learning row. This is the other half of "learn
 * what time actually costs" — actuals are compared to the estimated breakdown
 * captured at generation. Advances the claim to `complete`.
 */
export function recordJobActuals(
  claimId: string,
  input: {
    actualLabor: number;
    actualMaterials: number;
    actualEquipment: number;
    actualHours: number;
  },
) {
  return scoped(async (tx, ctx) => {
    const [claim] = await tx
      .select({ id: schema.claims.id })
      .from(schema.claims)
      .where(
        and(
          eq(schema.claims.id, claimId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .limit(1);
    if (!claim) throw new Error("Claim not found");

    const [updated] = await tx
      .update(schema.historicalJobs)
      .set({
        actualLabor: input.actualLabor,
        actualMaterials: input.actualMaterials,
        actualEquipment: input.actualEquipment,
        actualHours: input.actualHours,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.historicalJobs.claimId, claimId),
          eq(schema.historicalJobs.tenantId, ctx.tenantId),
        ),
      )
      .returning({ id: schema.historicalJobs.id });
    if (!updated) throw new Error("No learning row for this claim");

    await tx
      .update(schema.claims)
      .set({ status: "complete", updatedAt: new Date() })
      .where(eq(schema.claims.id, claimId));
  });
}

/** Build line items from inputs and (re)write the claim's estimate. */
export function generateEstimateForClaim(
  claimId: string,
  input: { cause: CauseOfLoss; areas: string[]; photoCount: number },
) {
  return scoped(async (tx, ctx) => {
    const [claim] = await tx
      .select({ id: schema.claims.id })
      .from(schema.claims)
      .where(
        and(
          eq(schema.claims.id, claimId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .limit(1);
    if (!claim) throw new Error("Claim not found");

    const { items, timeline } = await buildGroundedEstimate(
      { cause: input.cause, areas: input.areas },
      ctx.tenantId,
    );
    const oh = 15;
    const profit = 15; // generation default tier (15/15), per design handoff
    const totals = computeTotals(items, oh, profit);
    const breakdown = summarizeBreakdown(items);

    // Keep the claim's cause in sync with the generation input.
    await tx
      .update(schema.claims)
      .set({ causeOfLoss: input.cause, updatedAt: new Date() })
      .where(eq(schema.claims.id, claimId));

    // Replace any prior estimate (and its learning row) so "latest" is
    // unambiguous for the editor and we don't double-count on regeneration.
    await tx.delete(schema.estimates).where(eq(schema.estimates.claimId, claimId));
    await tx
      .delete(schema.historicalJobs)
      .where(eq(schema.historicalJobs.claimId, claimId));

    const [est] = await tx
      .insert(schema.estimates)
      .values({
        claimId,
        opTier: opTierFor(oh, profit),
        overheadPct: oh,
        profitPct: profit,
        ballparkTotal: totals.ballparkTotal,
        masterTotal: totals.masterTotal,
        ho6Total: totals.ho6Total,
        rawLabor: breakdown.rawLabor,
        rawEquipment: breakdown.rawEquipment,
        rawMaterials: breakdown.rawMaterials,
        laborHours: breakdown.laborHours,
        timelineDays: timeline.expected,
        confidence: confidenceScore(input.photoCount),
        flagged: totals.flagged,
      })
      .returning();
    if (!est) throw new Error("Estimate insert failed");

    if (items.length > 0) {
      await tx.insert(schema.estimateLineItems).values(
        items.map((it, i) => ({
          estimateId: est.id,
          code: it.code,
          description: it.description,
          qty: it.qty,
          unitPrice: it.unitPrice,
          bucket: it.bucket,
          sortOrder: i,
          laborCost: it.laborCost,
          equipmentCost: it.equipmentCost,
          materialCost: it.materialCost,
          hours: it.hours,
          xaUnitPrice: it.xaUnitPrice,
        })),
      );
    }

    // Capture the estimated breakdown for the learning ledger; actuals are
    // filled at job close to calibrate time-cost vs work/material/equipment.
    await tx.insert(schema.historicalJobs).values({
      tenantId: ctx.tenantId,
      claimId,
      rawLabor: breakdown.rawLabor,
      rawMaterials: breakdown.rawMaterials,
      rawEquipment: breakdown.rawEquipment,
      estLaborHours: breakdown.laborHours,
      market: DEFAULT_MARKET,
      causeOfLoss: input.cause,
      scope: items.map((it) => it.code),
    });

    return est.id;
  });
}

export type OwnerBallpark = {
  claimId: string;
  estimateId: string;
  confidence: "High" | "Medium" | "Low";
  opTier: string;
  rawSubtotal: number;
  markup: number;
  ballpark: number;
  low: number;
  high: number;
  items: {
    label: string;
    qty: number;
    unitRaw: number;
    raw: number;
    bucket: CoverageBucket;
    note: string | null;
  }[];
};

/**
 * Owner-app intake → a real claim + estimate for the caller's tenant. The
 * tenant is resolved server-side (never trusted from the client); evidence is
 * passed only as a summed confidence weight (photo 1 · video 2 · scan 5), which
 * drives the confidence band. Returns the ballpark payload for surface A.
 */
export function createOwnerClaim(input: {
  role: OwnerRole;
  cause: CauseOfLoss;
  areas: string[];
  note: string;
  evidenceWeight: number;
}): Promise<OwnerBallpark> {
  return scoped(async (tx, ctx) => {
    const { items, timeline } = await buildGroundedEstimate(
      { cause: input.cause, areas: input.areas },
      ctx.tenantId,
    );
    const oh = 15;
    const profit = 15; // owner ballpark uses the 15/15 standard tier
    const totals = computeTotals(items, oh, profit);
    const breakdown = summarizeBreakdown(items);
    const confidence = confidenceScore(input.evidenceWeight);
    const label = confidenceLabel(confidence);
    const band = combinedBand(label, timeline);

    const [claim] = await tx
      .insert(schema.claims)
      .values({
        tenantId: ctx.tenantId,
        ownerRole: input.role,
        causeOfLoss: input.cause,
        description: input.note,
        status: "new",
      })
      .returning({ id: schema.claims.id });
    if (!claim) throw new Error("Claim insert failed");

    const [est] = await tx
      .insert(schema.estimates)
      .values({
        claimId: claim.id,
        opTier: opTierFor(oh, profit),
        overheadPct: oh,
        profitPct: profit,
        ballparkTotal: totals.ballparkTotal,
        masterTotal: totals.masterTotal,
        ho6Total: totals.ho6Total,
        rawLabor: breakdown.rawLabor,
        rawEquipment: breakdown.rawEquipment,
        rawMaterials: breakdown.rawMaterials,
        laborHours: breakdown.laborHours,
        timelineDays: timeline.expected,
        confidence,
        flagged: totals.flagged,
      })
      .returning({ id: schema.estimates.id });
    if (!est) throw new Error("Estimate insert failed");

    if (items.length > 0) {
      await tx.insert(schema.estimateLineItems).values(
        items.map((it, i) => ({
          estimateId: est.id,
          code: it.code,
          description: it.description,
          qty: it.qty,
          unitPrice: it.unitPrice,
          bucket: it.bucket,
          sortOrder: i,
          laborCost: it.laborCost,
          equipmentCost: it.equipmentCost,
          materialCost: it.materialCost,
          hours: it.hours,
          xaUnitPrice: it.xaUnitPrice,
        })),
      );
    }

    await tx.insert(schema.historicalJobs).values({
      tenantId: ctx.tenantId,
      claimId: claim.id,
      rawLabor: breakdown.rawLabor,
      rawMaterials: breakdown.rawMaterials,
      rawEquipment: breakdown.rawEquipment,
      estLaborHours: breakdown.laborHours,
      market: DEFAULT_MARKET,
      causeOfLoss: input.cause,
      scope: items.map((it) => it.code),
    });

    return {
      claimId: claim.id,
      estimateId: est.id,
      confidence: label,
      opTier: `${oh}/${profit}`,
      rawSubtotal: totals.raw,
      markup: totals.ballparkTotal - totals.raw,
      ballpark: totals.ballparkTotal,
      low: Math.round(totals.ballparkTotal * (1 - band)),
      high: Math.round(totals.ballparkTotal * (1 + band)),
      items: items.map((it) => ({
        label: it.description,
        qty: it.qty,
        unitRaw: it.unitPrice,
        raw: it.qty * it.unitPrice,
        bucket: it.bucket,
        note: it.note ?? null,
      })),
    };
  });
}

/** Owner approves dispatch: attach the NTE decision and advance to dispatched. */
export function dispatchOwnerClaim(claimId: string, nte: boolean) {
  return scoped(async (tx, ctx) => {
    const [claim] = await tx
      .update(schema.claims)
      .set({ status: "dispatched", updatedAt: new Date() })
      .where(
        and(
          eq(schema.claims.id, claimId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .returning({ id: schema.claims.id });
    if (!claim) throw new Error("Claim not found");

    const [latest] = await tx
      .select({ id: schema.estimates.id })
      .from(schema.estimates)
      .where(eq(schema.estimates.claimId, claimId))
      .orderBy(desc(schema.estimates.createdAt))
      .limit(1);
    if (latest) {
      await tx
        .update(schema.estimates)
        .set({ nteFlag: nte, updatedAt: new Date() })
        .where(eq(schema.estimates.id, latest.id));
    }
  });
}

/** Persist bucket moves, O&P, totals, and any admin override for an estimate. */
export function saveEstimate(
  estimateId: string,
  input: {
    buckets: { id: string; bucket: CoverageBucket }[];
    oh: number;
    profit: number;
    override: { by: string; reason: string } | null;
  },
) {
  return scoped(async (tx, ctx) => {
    const [owned] = await tx
      .select({ id: schema.estimates.id })
      .from(schema.estimates)
      .innerJoin(
        schema.claims,
        eq(schema.claims.id, schema.estimates.claimId),
      )
      .where(
        and(
          eq(schema.estimates.id, estimateId),
          eq(schema.claims.tenantId, ctx.tenantId),
        ),
      )
      .limit(1);
    if (!owned) throw new Error("Estimate not found");

    for (const m of input.buckets) {
      await tx
        .update(schema.estimateLineItems)
        .set({ bucket: m.bucket })
        .where(
          and(
            eq(schema.estimateLineItems.id, m.id),
            eq(schema.estimateLineItems.estimateId, estimateId),
          ),
        );
    }

    const lineItems = await tx
      .select({
        qty: schema.estimateLineItems.qty,
        unitPrice: schema.estimateLineItems.unitPrice,
        bucket: schema.estimateLineItems.bucket,
      })
      .from(schema.estimateLineItems)
      .where(eq(schema.estimateLineItems.estimateId, estimateId));

    const totals = computeTotals(lineItems, input.oh, input.profit);
    const overrideStored =
      totals.flagged && input.override
        ? `${input.override.by} — ${input.override.reason}`
        : null;

    await tx
      .update(schema.estimates)
      .set({
        opTier: opTierFor(input.oh, input.profit),
        overheadPct: input.oh,
        profitPct: input.profit,
        ballparkTotal: totals.ballparkTotal,
        masterTotal: totals.masterTotal,
        ho6Total: totals.ho6Total,
        flagged: totals.flagged,
        overrideReason: overrideStored,
        overrideBy: overrideStored && !ctx.isDevFallback ? ctx.userId : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.estimates.id, estimateId));
  });
}
