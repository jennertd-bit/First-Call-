"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { OwnerRole } from "@firstcall/types";
import { createOwner } from "@/lib/data";

const CreateOwner = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  contact: z.string().trim().min(1, "Contact is required").max(200),
  role: OwnerRole,
});

export async function createOwnerAction(formData: FormData) {
  const parsed = CreateOwner.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/crm/owners?error=${encodeURIComponent(msg)}`);
  }
  await createOwner(parsed.data);
  revalidatePath("/crm/owners");
  redirect("/crm/owners");
}
