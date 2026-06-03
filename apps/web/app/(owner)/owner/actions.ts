"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CauseOfLoss, OwnerRole } from "@firstcall/types";
import {
  createOwnerClaim,
  dispatchOwnerClaim,
  type OwnerBallpark,
} from "@/lib/data";

const IntakeSchema = z.object({
  role: OwnerRole,
  cause: CauseOfLoss,
  areas: z.array(z.string().max(32)).max(20),
  note: z.string().trim().max(2000),
  evidenceWeight: z.number().int().min(0).max(200),
});

export async function createOwnerClaimAction(
  raw: unknown,
): Promise<OwnerBallpark> {
  const input = IntakeSchema.parse(raw);
  const ballpark = await createOwnerClaim(input);
  revalidatePath("/crm");
  return ballpark;
}

const DispatchSchema = z.object({
  claimId: z.string().uuid(),
  nte: z.boolean(),
});

export async function dispatchOwnerClaimAction(raw: unknown) {
  const input = DispatchSchema.parse(raw);
  await dispatchOwnerClaim(input.claimId, input.nte);
  revalidatePath("/crm");
  revalidatePath(`/crm/jobs/${input.claimId}`);
}
