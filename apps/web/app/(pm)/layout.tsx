import type { ReactNode } from "react";
import { SurfaceSwitcher } from "@/app/_components/surface-switcher";

// Per-request (session + tenant data); never prerender at build.
export const dynamic = "force-dynamic";

/** Surface B shell — responsive web PM/HOA portal (spec §7). */
export default function PmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[var(--brand-primary)]">
          PM / HOA Portal
        </h1>
        <SurfaceSwitcher />
      </header>
      {children}
    </div>
  );
}
