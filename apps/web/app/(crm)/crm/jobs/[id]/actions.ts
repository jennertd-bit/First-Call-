"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CauseOfLoss, CoverageBucket, JobStatus } from "@firstcall/types";
import {
  generateEstimateForClaim,
  recordJobActuals,
  saveEstimate,
  setClaimStatus,
} from "@/lib/data";

const toCents = (dollars: number) => Math.round(dollars * 100);

const GenerateSchema = z.object({
  claimId: z.string().uuid(),
  cause: CauseOfLoss,
  areas: z.array(z.string().max(32)).max(20),
  photoCount: z.number().int().min(0).max(50),
});

export async function generateEstimateAction(raw: unknown) {
  const input = GenerateSchema.parse(raw);
  await generateEstimateForClaim(input.claimId, {
    cause: input.cause,
    areas: input.areas,
    photoCount: input.photoCount,
  });
  revalidatePath(`/crm/jobs/${input.claimId}`);
  revalidatePath("/crm");
}

const SaveSchema = z.object({
  estimateId: z.string().uuid(),
  claimId: z.string().uuid(),
  buckets: z.array(
    z.object({ id: z.string().uuid(), bucket: CoverageBucket }),
  ),
  oh: z.number().int().min(0).max(40),
  profit: z.number().int().min(0).max(40),
  override: z
    .object({ by: z.string().trim().min(1), reason: z.string().trim().min(1) })
    .nullable(),
});

export async function saveEstimateAction(raw: unknown) {
  const input = SaveSchema.parse(raw);
  await saveEstimate(input.estimateId, {
    buckets: input.buckets,
    oh: input.oh,
    profit: input.profit,
    override: input.override,
  });
  revalidatePath(`/crm/jobs/${input.claimId}`);
  revalidatePath("/crm");
}

const StatusSchema = z.object({
  claimId: z.string().uuid(),
  status: JobStatus,
});

export async function setClaimStatusAction(raw: unknown) {
  const input = StatusSchema.parse(raw);
  await setClaimStatus(input.claimId, input.status);
  revalidatePath("/crm");
  revalidatePath(`/crm/jobs/${input.claimId}`);
}

const ActualsSchema = z.object({
  claimId: z.string().uuid(),
  // Dollars from the UI; converted to integer cents server-side.
  actualLabor: z.number().min(0).max(10_000_000),
  actualMaterials: z.number().min(0).max(10_000_000),
  actualEquipment: z.number().min(0).max(10_000_000),
  actualHours: z.number().min(0).max(100_000),
});

export async function recordJobActualsAction(raw: unknown) {
  const input = ActualsSchema.parse(raw);
  await recordJobActuals(input.claimId, {
    actualLabor: toCents(input.actualLabor),
    actualMaterials: toCents(input.actualMaterials),
    actualEquipment: toCents(input.actualEquipment),
    actualHours: input.actualHours,
  });
  revalidatePath(`/crm/jobs/${input.claimId}`);
  revalidatePath("/crm");
}
