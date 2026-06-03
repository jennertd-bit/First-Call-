"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PropertyType } from "@firstcall/types";
import { createProperty, createUnit, setUnitHo6 } from "@/lib/data";

const CreateProperty = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  address: z.string().trim().min(1, "Address is required").max(300),
  type: PropertyType,
});

export async function createPropertyAction(formData: FormData) {
  const parsed = CreateProperty.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/crm/properties?error=${encodeURIComponent(msg)}`);
  }
  const property = await createProperty(parsed.data);
  revalidatePath("/crm/properties");
  redirect(`/crm/properties/${property!.id}`);
}

const Ho6 = z.enum(["verified", "pending", "none"]);

const CreateUnit = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().trim().min(1, "Unit number is required").max(50),
  ho6Status: Ho6,
});

export async function createUnitAction(formData: FormData) {
  const parsed = CreateUnit.safeParse({
    propertyId: formData.get("propertyId"),
    unitNumber: formData.get("unitNumber"),
    ho6Status: formData.get("ho6Status"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    const pid = String(formData.get("propertyId") ?? "");
    redirect(`/crm/properties/${pid}?error=${encodeURIComponent(msg)}`);
  }
  await createUnit(parsed.data);
  revalidatePath(`/crm/properties/${parsed.data.propertyId}`);
  redirect(`/crm/properties/${parsed.data.propertyId}`);
}

const SetHo6 = z.object({
  unitId: z.string().uuid(),
  propertyId: z.string().uuid(),
  ho6Status: Ho6,
});

export async function setUnitHo6Action(formData: FormData) {
  const parsed = SetHo6.safeParse({
    unitId: formData.get("unitId"),
    propertyId: formData.get("propertyId"),
    ho6Status: formData.get("ho6Status"),
  });
  if (!parsed.success) return;
  await setUnitHo6(parsed.data.unitId, parsed.data.ho6Status);
  revalidatePath(`/crm/properties/${parsed.data.propertyId}`);
}
