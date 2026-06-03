import { DEFAULT_BRANDING } from "@firstcall/ui/theme";
import type { TenantBranding } from "@firstcall/types";
import { headers } from "next/headers";

/**
 * Resolve the active tenant from the request subdomain (white-label, spec §4).
 * Phase 0 returns placeholder branding; Phase 6 wires this to the tenants table
 * keyed by `branding.subdomain`. NEVER trust the client for tenant_id beyond
 * this server-side resolution.
 */
export async function resolveTenantBranding(): Promise<TenantBranding> {
  const host = (await headers()).get("host") ?? "";
  const subdomain = host.split(".")[0] ?? "demo";
  return { ...DEFAULT_BRANDING, subdomain };
}
