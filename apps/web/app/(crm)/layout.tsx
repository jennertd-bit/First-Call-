import type { ReactNode } from "react";
import { getTenantName } from "@/lib/data";
import { CrmSidebar, CrmTopBar } from "./_components/shell";

/** Surface C shell — desktop web CRM/ERP (spec §8, design handoff). */
export default async function CrmLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenantName();
  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <CrmSidebar tenant={tenant} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
