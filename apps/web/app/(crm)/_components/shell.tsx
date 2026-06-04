"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

/**
 * Surface C shell. Desktop: static 248px sidebar + topbar. Mobile (<lg): the
 * sidebar collapses into a slide-in drawer toggled by the topbar hamburger, so
 * the full width goes to content. Drawer state lives here and auto-closes on
 * navigation.
 */
export function CrmShell({
  tenant,
  children,
}: {
  tenant: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Collapse the drawer whenever the route changes (mobile nav tap).
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(14,42,71,0.45)] lg:hidden"
        />
      ) : null}
      <CrmSidebar tenant={tenant} open={open} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopBar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function CrmSidebar({
  tenant,
  open = false,
}: {
  tenant: string;
  open?: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={
        "fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] flex-shrink-0 flex-col border-r border-line bg-card transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 " +
        (open ? "translate-x-0" : "-translate-x-full")
      }
    >
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

      <div className="space-y-2.5 p-3">
        {/* Surface switcher lives in the topbar on desktop; on mobile it moves
            into the drawer so all navigation stays in one place. */}
        <div className="lg:hidden">
          <SurfaceSwitcher />
        </div>
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

export function CrmTopBar({
  actions,
  onMenu,
}: {
  actions?: React.ReactNode;
  onMenu?: () => void;
}) {
  const pathname = usePathname();
  const item = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => isActive(pathname, n.href));
  const title = item?.section ?? "Restoration CRM";
  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-line bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="-ml-1 grid h-9 w-9 flex-shrink-0 place-items-center rounded-control text-[var(--brand-primary)] transition-colors hover:bg-[var(--hover)] lg:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="truncate text-base font-bold tracking-[-0.015em] text-[var(--brand-primary)] sm:text-lg">
            {title}
          </div>
          <div className="mono-label mt-0.5 text-[11px]">FirstCall · CRM</div>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        {actions}
        <div className="hidden lg:block">
          <SurfaceSwitcher />
        </div>
      </div>
    </div>
  );
}
