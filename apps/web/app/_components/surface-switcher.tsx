"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const surfaces = [
  { href: "/owner", label: "Owner App", id: "owner" },
  { href: "/pm", label: "PM Portal", id: "pm" },
  { href: "/crm", label: "Restoration CRM", id: "crm" },
];

/**
 * Cross-surface navigation pill shared by all three shells (Owner / PM / CRM)
 * so no surface is a dead end. Highlights the current surface and links to the
 * others.
 */
export function SurfaceSwitcher() {
  const pathname = usePathname();
  const current = pathname.startsWith("/pm")
    ? "pm"
    : pathname.startsWith("/owner")
      ? "owner"
      : "crm";
  return (
    <div className="flex gap-[3px] rounded-[11px] border border-line2 bg-[var(--hover)] p-[3px]">
      {surfaces.map((s) =>
        s.id === current ? (
          <span
            key={s.id}
            className="rounded-lg bg-card px-3 py-1.5 font-mono text-[11.5px] font-semibold tracking-[0.02em] text-[var(--brand-primary)] shadow-sm"
          >
            {s.label}
          </span>
        ) : (
          <Link
            key={s.id}
            href={s.href}
            className="rounded-lg px-3 py-1.5 font-mono text-[11.5px] font-medium tracking-[0.02em] text-gray hover:text-[var(--brand-primary)]"
          >
            {s.label}
          </Link>
        ),
      )}
    </div>
  );
}
