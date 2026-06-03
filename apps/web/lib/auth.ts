import "server-only";
import { db, schema } from "@firstcall/db";
import type { UserRole } from "@firstcall/types";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export type SessionContext = {
  userId: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
  isDevFallback: boolean;
};

/**
 * Resolve the acting user + tenant for a Surface C request.
 *
 * Production path: read the Supabase session, look the user up in `users`,
 * and use the server-side `tenant_id` — NEVER a client-supplied value.
 *
 * Dev path: when no session exists (auth UI lands later this phase), fall back
 * to the seeded tenant + a synthetic vendor_admin so the CRM is workable. The
 * fallback is gated on FIRSTCALL_DEV_AUTH=true and is never silently used in
 * production.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    if (!row || !row.tenantId) return null;

    return {
      userId: row.id,
      tenantId: row.tenantId,
      role: row.role,
      name: row.name,
      email: row.email,
      isDevFallback: false,
    };
  }

  if (process.env.FIRSTCALL_DEV_AUTH === "true") {
    const [tenant] = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .limit(1);
    if (!tenant) return null;
    return {
      userId: "00000000-0000-0000-0000-000000000000",
      tenantId: tenant.id,
      role: "vendor_admin",
      name: "Dev Admin",
      email: "dev@firstcall.local",
      isDevFallback: true,
    };
  }

  return null;
}

/** Throwing variant for pages/actions that require a session. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new Error("Not authenticated");
  }
  return ctx;
}
