import type { TenantBranding } from "@firstcall/types";

/**
 * Per-tenant white-label theming (spec §4/§11). Branding maps to CSS custom
 * properties consumed by Tailwind via `var(--brand-*)`. Set these on a wrapper
 * element (e.g. <body> in the tenant layout) so all three surfaces inherit.
 */
export function brandingToCssVars(
  branding: Pick<TenantBranding, "primaryColor" | "accentColor">,
): Record<string, string> {
  return {
    "--brand-primary": branding.primaryColor,
    "--brand-accent": branding.accentColor,
    "--brand-accent-dark": darken(branding.accentColor, 0.12),
  };
}

/** Mix a hex color toward black by `amount` (0–1). Used for accent hover/dark. */
function darken(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return hex;
  const n = parseInt(m[1], 16);
  const f = 1 - amount;
  const r = Math.round(((n >> 16) & 0xff) * f);
  const g = Math.round(((n >> 8) & 0xff) * f);
  const b = Math.round((n & 0xff) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const DEFAULT_BRANDING: TenantBranding = {
  logoUrl: null,
  primaryColor: "#0e2a47", // navy (design handoff WT)
  accentColor: "#e8703a", // accent orange (design handoff WT)
  subdomain: "demo",
};
