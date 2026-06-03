import "./load-env";
import { dollarsToCents } from "@firstcall/types";
import { db } from "./client";
import {
  claims,
  historicalJobs,
  priceListItems,
  properties,
  tenants,
  units,
} from "./schema";

/**
 * Phase 0 seed: one white-label tenant with a property, units, a starter
 * price list, and a handful of O&P-stripped historical jobs. Idempotent-ish:
 * intended to run against a fresh dev DB.
 */
async function main() {
  console.log("Seeding FirstCall demo tenant…");

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Acme Restoration",
      defaultOpTier: "10_10",
      branding: {
        logoUrl: null,
        primaryColor: "#0f2a4a", // navy
        accentColor: "#f26b21", // orange
        subdomain: "acme",
      },
    })
    .returning();

  if (!tenant) throw new Error("tenant insert failed");

  const [property] = await db
    .insert(properties)
    .values({
      tenantId: tenant.id,
      name: "Bayview Condos",
      address: "100 Harbor Way, San Diego, CA",
      type: "condo",
    })
    .returning();

  if (!property) throw new Error("property insert failed");

  const seededUnits = await db
    .insert(units)
    .values([
      { propertyId: property.id, unitNumber: "101", ho6Status: "verified" },
      { propertyId: property.id, unitNumber: "102", ho6Status: "pending" },
      { propertyId: property.id, unitNumber: "103", ho6Status: "none" },
    ])
    .returning();

  const unitId = (n: string) =>
    seededUnits.find((u) => u.unitNumber === n)?.id ?? null;

  await db.insert(claims).values([
    {
      tenantId: tenant.id,
      unitId: unitId("103"),
      ownerRole: "unit_owner",
      causeOfLoss: "water",
      description: "Supply line burst under kitchen sink; cabinets soaked.",
      status: "new",
      photos: [],
    },
    {
      tenantId: tenant.id,
      unitId: unitId("102"),
      ownerRole: "unit_owner",
      causeOfLoss: "mold",
      description: "Bathroom ceiling mold growth following slow roof leak.",
      status: "dispatched",
      photos: [],
    },
    {
      tenantId: tenant.id,
      unitId: unitId("101"),
      ownerRole: "hoa",
      causeOfLoss: "storm",
      description: "Wind-driven rain through failed window seals, 3rd floor.",
      status: "on_site",
      photos: [],
    },
    {
      tenantId: tenant.id,
      unitId: unitId("102"),
      ownerRole: "unit_owner",
      causeOfLoss: "fire",
      description: "Kitchen grease fire; soot throughout unit, contents affected.",
      status: "estimate",
      photos: [],
    },
    {
      tenantId: tenant.id,
      unitId: unitId("101"),
      ownerRole: "unit_owner",
      causeOfLoss: "water",
      description: "Washer overflow; flooring and baseboards in living room.",
      status: "signed",
      photos: [],
    },
  ]);

  await db.insert(priceListItems).values([
    {
      tenantId: tenant.id,
      code: "WTR-EXT-SF",
      description: "Water extraction, per SF",
      iicrcCategory: "S500",
      unit: "SF",
      unitPrice: dollarsToCents(0.85),
    },
    {
      tenantId: tenant.id,
      code: "DEHU-DAY",
      description: "Dehumidifier, per day",
      iicrcCategory: "S500",
      unit: "DAY",
      unitPrice: dollarsToCents(95.0),
    },
    {
      tenantId: tenant.id,
      code: "AM-DAY",
      description: "Air mover, per day",
      iicrcCategory: "S500",
      unit: "DAY",
      unitPrice: dollarsToCents(35.0),
    },
    {
      tenantId: tenant.id,
      code: "DRY-RMV-SF",
      description: "Drywall removal, per SF",
      iicrcCategory: "S500",
      unit: "SF",
      unitPrice: dollarsToCents(2.1),
    },
  ]);

  await db.insert(historicalJobs).values([
    {
      tenantId: tenant.id,
      rawLabor: dollarsToCents(1800),
      rawMaterials: dollarsToCents(950),
      rawEquipment: dollarsToCents(600),
      market: "CA-San Diego",
      causeOfLoss: "water",
      scope: ["water_extraction", "drying", "drywall_removal"],
    },
    {
      tenantId: tenant.id,
      rawLabor: dollarsToCents(3200),
      rawMaterials: dollarsToCents(2100),
      rawEquipment: dollarsToCents(400),
      market: "CA-San Diego",
      causeOfLoss: "fire",
      scope: ["soot_cleaning", "deodorization", "drywall_removal"],
    },
  ]);

  console.log(`Seeded tenant ${tenant.id} (${tenant.name}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
