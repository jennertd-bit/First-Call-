import { z } from "zod";
import {
  CauseOfLoss,
  CoverageBucket,
  Ho6Status,
  JobStatus,
  OpTier,
  OwnerRole,
  PropertyType,
  UserRole,
} from "./enums";

const uuid = z.string().uuid();
const cents = z.number().int();

export const TenantBranding = z.object({
  logoUrl: z.string().url().nullable(),
  primaryColor: z.string(),
  accentColor: z.string(),
  subdomain: z.string().min(1),
});
export type TenantBranding = z.infer<typeof TenantBranding>;

export const Tenant = z.object({
  id: uuid,
  name: z.string().min(1),
  branding: TenantBranding,
  defaultOpTier: OpTier,
});
export type Tenant = z.infer<typeof Tenant>;

export const User = z.object({
  id: uuid,
  tenantId: uuid.nullable(),
  role: UserRole,
  name: z.string(),
  email: z.string().email(),
});
export type User = z.infer<typeof User>;

export const Property = z.object({
  id: uuid,
  tenantId: uuid,
  name: z.string(),
  address: z.string(),
  type: PropertyType,
});
export type Property = z.infer<typeof Property>;

export const Unit = z.object({
  id: uuid,
  propertyId: uuid,
  unitNumber: z.string(),
  ownerId: uuid.nullable(),
  ho6Status: Ho6Status,
});
export type Unit = z.infer<typeof Unit>;

export const PriceListItem = z.object({
  id: uuid,
  tenantId: uuid,
  code: z.string(),
  description: z.string(),
  iicrcCategory: z.string().nullable(),
  unit: z.string(),
  unitPrice: cents,
});
export type PriceListItem = z.infer<typeof PriceListItem>;

export const EstimateLineItem = z.object({
  id: uuid,
  estimateId: uuid,
  code: z.string(),
  description: z.string(),
  qty: z.number(),
  unitPrice: cents,
  bucket: CoverageBucket,
});
export type EstimateLineItem = z.infer<typeof EstimateLineItem>;

export const Estimate = z.object({
  id: uuid,
  claimId: uuid,
  opTier: OpTier,
  nteFlag: z.boolean(),
  ballparkTotal: cents,
  masterTotal: cents,
  ho6Total: cents,
  confidence: z.number().min(0).max(1).nullable(),
  flagged: z.boolean(),
  override: z
    .object({ by: uuid, reason: z.string().min(1) })
    .nullable(),
  lineItems: z.array(EstimateLineItem),
});
export type Estimate = z.infer<typeof Estimate>;

export const Claim = z.object({
  id: uuid,
  tenantId: uuid,
  unitId: uuid.nullable(),
  ownerRole: OwnerRole,
  causeOfLoss: CauseOfLoss,
  photos: z.array(z.string().url()).max(10),
  description: z.string(),
  status: JobStatus,
});
export type Claim = z.infer<typeof Claim>;

/** Surface A guided-intake payload. Photos capped at 10 (spec §6). */
export const CreateClaimInput = z.object({
  ownerRole: OwnerRole,
  causeOfLoss: CauseOfLoss,
  photos: z.array(z.string().url()).max(10).default([]),
  description: z.string().max(2000),
  unitId: uuid.optional(),
});
export type CreateClaimInput = z.infer<typeof CreateClaimInput>;
