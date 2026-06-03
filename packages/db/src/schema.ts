import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------------------------------------- enums */

export const userRole = pgEnum("user_role", [
  "owner",
  "pm",
  "vendor_staff",
  "vendor_admin",
  "superadmin",
]);
export const propertyType = pgEnum("property_type", [
  "condo",
  "single",
  "commercial",
]);
export const ho6Status = pgEnum("ho6_status", ["verified", "pending", "none"]);
export const ownerRole = pgEnum("owner_role", ["hoa", "unit_owner", "tenant"]);
export const causeOfLoss = pgEnum("cause_of_loss", [
  "water",
  "fire",
  "mold",
  "storm",
  "other",
]);
export const jobStatus = pgEnum("job_status", [
  "new",
  "dispatched",
  "on_site",
  "estimate",
  "signed",
  "complete",
  "lost",
]);
export const coverageBucket = pgEnum("coverage_bucket", ["master", "ho6"]);
export const opTier = pgEnum("op_tier", ["10_10", "15_15", "20_20", "custom"]);
export const costCategory = pgEnum("cost_category", [
  "labor",
  "equipment",
  "vehicle",
  "consumable",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

/* -------------------------------------------------------------- tenants */

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  branding: jsonb("branding")
    .$type<{
      logoUrl: string | null;
      primaryColor: string;
      accentColor: string;
      subdomain: string;
    }>()
    .notNull(),
  defaultOpTier: opTier("default_op_tier").notNull().default("10_10"),
  ...timestamps,
});

/** Mirrors auth.users; tenantId null only for superadmin. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, {
    onDelete: "cascade",
  }),
  role: userRole("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  ...timestamps,
});

/* ------------------------------------------------------- properties etc */

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: propertyType("type").notNull(),
  ...timestamps,
});

export const owners = pgTable("owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  role: ownerRole("role").notNull(),
  ...timestamps,
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  ownerId: uuid("owner_id").references(() => owners.id, {
    onDelete: "set null",
  }),
  ho6Status: ho6Status("ho6_status").notNull().default("none"),
  ...timestamps,
});

export const masterPolicies = pgTable("master_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  fileUrl: text("file_url"),
  parsedCoverage: jsonb("parsed_coverage").$type<{
    master: string[];
    ho6: string[];
  }>(),
  ...timestamps,
});

export const msas = pgTable("msas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, {
    onDelete: "cascade",
  }),
  opTier: opTier("op_tier").notNull().default("10_10"),
  specialtyPricing: jsonb("specialty_pricing").$type<Record<string, number>>(),
  ...timestamps,
});

/* ----------------------------------------------------------- price list */

/** Per-tenant T&M items (count is per tenant, never a global constant).
 *  unitPrice in integer cents. `code` is unique within a tenant (import dedupe). */
export const priceListItems = pgTable(
  "price_list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    description: text("description").notNull(),
    iicrcCategory: text("iicrc_category"),
    unit: text("unit").notNull(),
    unitPrice: integer("unit_price").notNull(),
    ...timestamps,
  },
  (t) => ({
    tenantCodeIdx: uniqueIndex("price_list_items_tenant_code_idx").on(
      t.tenantId,
      t.code,
    ),
  }),
);

/* ------------------------------------------------ internal cost basis */

/**
 * Confidential time-&-materials cost basis (e.g. WrightWay 2025 list). This is
 * the tenant's TRUE internal cost, used only on the backend to ground estimate
 * pricing — it is NEVER exposed to any client surface. Enforced like
 * `learning_records`: RLS is enabled with NO permissive policy, so the runtime
 * `firstcall_app` role gets zero rows; only the service role (loaders/admin)
 * can read or write it.
 *
 * `standardRate` is the listed rate in integer cents for the row's `unit`
 * (hourly for labor, per Day or per Mile for equipment/vehicles, per-unit for
 * consumables). `overtimeRate` carries labor after-hours/OT (null otherwise).
 * A resource priced in two units (e.g. a van billed per Day and per Mile) is
 * two rows, so the row is unique within a tenant on (category, name, unit).
 */
export const costBasisItems = pgTable(
  "cost_basis_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    category: costCategory("category").notNull(),
    name: text("name").notNull(),
    unit: text("unit").notNull(),
    standardRate: integer("standard_rate").notNull(),
    overtimeRate: integer("overtime_rate"),
    ...timestamps,
  },
  (t) => ({
    tenantCategoryNameUnitIdx: uniqueIndex(
      "cost_basis_items_tenant_category_name_unit_idx",
    ).on(t.tenantId, t.category, t.name, t.unit),
  }),
);

/* --------------------------------------------------------------- claims */

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  ownerRole: ownerRole("owner_role").notNull(),
  causeOfLoss: causeOfLoss("cause_of_loss").notNull(),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  description: text("description").notNull().default(""),
  status: jobStatus("status").notNull().default("new"),
  ...timestamps,
});

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  opTier: opTier("op_tier").notNull().default("10_10"),
  overheadPct: integer("overhead_pct").notNull().default(10),
  profitPct: integer("profit_pct").notNull().default(10),
  nteFlag: boolean("nte_flag").notNull().default(false),
  ballparkTotal: integer("ballpark_total").notNull().default(0),
  masterTotal: integer("master_total").notNull().default(0),
  ho6Total: integer("ho6_total").notNull().default(0),
  // O&P-stripped raw breakdown (cents) — the time-vs-work/material/equipment
  // split that the learning dataset calibrates against actuals.
  rawLabor: integer("raw_labor").notNull().default(0),
  rawEquipment: integer("raw_equipment").notNull().default(0),
  rawMaterials: integer("raw_materials").notNull().default(0),
  laborHours: real("labor_hours").notNull().default(0),
  timelineDays: real("timeline_days").notNull().default(0),
  confidence: real("confidence"),
  flagged: boolean("flagged").notNull().default(false),
  overrideBy: uuid("override_by").references(() => users.id, {
    onDelete: "set null",
  }),
  overrideReason: text("override_reason"),
  ...timestamps,
});

export const estimateLineItems = pgTable("estimate_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  description: text("description").notNull(),
  qty: real("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
  bucket: coverageBucket("bucket").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  // Per-unit grounded breakdown (cents) so the editor can show how each line
  // snaps to T&M labor/equipment/material, plus the XA cross-check anchor.
  laborCost: integer("labor_cost").notNull().default(0),
  equipmentCost: integer("equipment_cost").notNull().default(0),
  materialCost: integer("material_cost").notNull().default(0),
  hours: real("hours").notNull().default(0),
  xaUnitPrice: integer("xa_unit_price"),
});

/* ----------------------------------------------------- learning dataset */

/**
 * Job cost ledger + learning dataset. The `raw*` columns are the ESTIMATED
 * O&P-stripped breakdown captured at generation; the `actual*` columns are
 * filled at job close. Comparing estimated vs actual time-cost is how the
 * system "learns what time actually costs" against work+material/equipment.
 * Seed onboarding rows have a null claimId and null actuals.
 */
export const historicalJobs = pgTable("historical_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  claimId: uuid("claim_id").references(() => claims.id, {
    onDelete: "set null",
  }),
  rawLabor: integer("raw_labor").notNull(),
  rawMaterials: integer("raw_materials").notNull(),
  rawEquipment: integer("raw_equipment").notNull(),
  estLaborHours: real("est_labor_hours").notNull().default(0),
  actualLabor: integer("actual_labor"),
  actualMaterials: integer("actual_materials"),
  actualEquipment: integer("actual_equipment"),
  actualHours: real("actual_hours"),
  opStripped: boolean("op_stripped").notNull().default(true),
  market: text("market").notNull(),
  causeOfLoss: causeOfLoss("cause_of_loss").notNull(),
  scope: jsonb("scope").$type<string[]>().notNull().default([]),
  ...timestamps,
});

/** Normalized, anonymized row contributed to the shared model. */
export const learningRecords = pgTable("learning_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  market: text("market").notNull(),
  causeOfLoss: causeOfLoss("cause_of_loss").notNull(),
  rawLabor: integer("raw_labor").notNull(),
  rawMaterials: integer("raw_materials").notNull(),
  rawEquipment: integer("raw_equipment").notNull(),
  scope: jsonb("scope").$type<string[]>().notNull().default([]),
  quarantined: boolean("quarantined").notNull().default(false),
  sourceTenantHash: text("source_tenant_hash").notNull(),
  ...timestamps,
});

/* ------------------------------------------------------------ relations */

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  properties: many(properties),
  priceListItems: many(priceListItems),
  claims: many(claims),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [properties.tenantId],
    references: [tenants.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  owner: one(owners, { fields: [units.ownerId], references: [owners.id] }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  tenant: one(tenants, { fields: [claims.tenantId], references: [tenants.id] }),
  unit: one(units, { fields: [claims.unitId], references: [units.id] }),
  estimates: many(estimates),
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  claim: one(claims, { fields: [estimates.claimId], references: [claims.id] }),
  lineItems: many(estimateLineItems),
}));

export const estimateLineItemsRelations = relations(
  estimateLineItems,
  ({ one }) => ({
    estimate: one(estimates, {
      fields: [estimateLineItems.estimateId],
      references: [estimates.id],
    }),
  }),
);
