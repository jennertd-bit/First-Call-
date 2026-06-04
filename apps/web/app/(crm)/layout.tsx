import type { ReactNode } from "react";
import { getTenantName } from "@/lib/data";
import { CrmShell } from "./_components/shell";

// These surfaces are per-request (session + tenant data); never prerender at
// build, so the build needs no database connection.
export const dynamic = "force-dynamic";

/** Surface C shell — responsive web CRM/ERP (spec §8, design handoff). */
export default async function CrmLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenantName();
  return <CrmShell tenant={tenant}>{children}</CrmShell>;
}
