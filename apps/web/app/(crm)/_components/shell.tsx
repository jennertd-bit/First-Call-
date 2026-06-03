"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; section: string };

const nav: NavItem[] = [
  { href: "/crm", label: "Dispatch Board", section: "Dispatch Board" },
  {
    href: "/crm/properties",
    label: "Properties & Units",
    section: "Properties & Units",
  },
  {
    href: "/crm/owners",
    label: "Owners & Insurance",
    section: "Owners & Insurance",
  },
  { href: "/crm/price-list", label: "Price List", section: "Price List" },
];

const surfaces = [
  { href: "/owner", label: "Owner App", id: "owner" },
  { href: "/pm", label: "PM Portal", id: "pm" },
  { href: "/crm", label: "Restoration CRM", id: "crm" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/crm") return pathname === "/crm";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CrmSidebar({ tenant }: { tenant: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-[248px] flex-shrink-0 flex-col border-r border-line bg-card">
      <div className="flex items-center gap-[11px] px-[18px] pb-4 pt-5">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--brand-accent)] font-mono text-[18px] font-semibold text-white shadow-[0_4px_12px_rgba(232,112,58,0.3)]">
          F
        </div>
        <div>
          <div className="font-mono text-sm font-semibold tracking-[0.02em] text-[var(--brand-primary)]">
            FirstCall
          </div>
          <div className="mt-px text-[11px] text-faint">Restoration CRM</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1.5">
        <div className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const on = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  on
                    ? "flex items-center gap-[11px] rounded-control bg-[rgba(232,112,58,0.10)] px-[11px] py-[9px] text-[13.5px] font-semibold text-[var(--brand-accent)]"
                    : "flex items-center gap-[11px] rounded-control px-[11px] py-[9px] text-[13.5px] font-medium text-gray transition-colors hover:bg-[var(--hover)] hover:text-[var(--brand-primary)]"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-[11px] border border-line2 bg-wash px-2.5 py-[9px]">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[var(--brand-primary)] font-mono text-[13px] font-semibold text-white">
            {tenant.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-[var(--brand-primary)]">
              {tenant}
            </div>
            <div className="text-[10.5px] text-faint">Tenant workspace</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SurfaceSwitcher() {
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

export function CrmTopBar({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();
  const item = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => isActive(pathname, n.href));
  const title = item?.section ?? "Restoration CRM";
  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-line bg-card px-6">
      <div className="min-w-0 flex-shrink-0">
        <div className="whitespace-nowrap text-lg font-bold tracking-[-0.015em] text-[var(--brand-primary)]">
          {title}
        </div>
        <div className="mono-label mt-0.5 text-[11px]">FirstCall · CRM</div>
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <SurfaceSwitcher />
      </div>
    </div>
  );
}
