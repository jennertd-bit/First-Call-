import type { ReactNode } from "react";

/** Surface B shell — responsive web PM/HOA portal (spec §7). */
export default function PmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold text-[var(--brand-primary)]">
          PM / HOA Portal
        </h1>
      </header>
      {children}
    </div>
  );
}
