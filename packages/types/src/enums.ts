import { z } from "zod";

/** RBAC roles (spec §4). superadmin spans tenants; vendor_* belong to a tenant. */
export const UserRole = z.enum([
  "owner",
  "pm",
  "vendor_staff",
  "vendor_admin",
  "superadmin",
]);
export type UserRole = z.infer<typeof UserRole>;

export const PropertyType = z.enum(["condo", "single", "commercial"]);
export type PropertyType = z.infer<typeof PropertyType>;

export const Ho6Status = z.enum(["verified", "pending", "none"]);
export type Ho6Status = z.infer<typeof Ho6Status>;

/** Surface A role gate — selecting unit_owner tags the claim for HO6 separation. */
export const OwnerRole = z.enum(["hoa", "unit_owner", "tenant"]);
export type OwnerRole = z.infer<typeof OwnerRole>;

export const CauseOfLoss = z.enum(["water", "fire", "mold", "storm", "other"]);
export type CauseOfLoss = z.infer<typeof CauseOfLoss>;

/** Job lifecycle (spec §5). `lost` is terminal-off-pipeline. */
export const JobStatus = z.enum([
  "new",
  "dispatched",
  "on_site",
  "estimate",
  "signed",
  "complete",
  "lost",
]);
export type JobStatus = z.infer<typeof JobStatus>;

/** Coverage bucket — which policy pays for a line item. */
export const CoverageBucket = z.enum(["master", "ho6"]);
export type CoverageBucket = z.infer<typeof CoverageBucket>;

/** Standard O&P tiers. Anything outside these is flagged by the guardrail (spec §8). */
export const OpTier = z.enum(["10_10", "15_15", "20_20", "custom"]);
export type OpTier = z.infer<typeof OpTier>;
