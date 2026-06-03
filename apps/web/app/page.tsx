import Link from "next/link";
import { Card } from "@firstcall/ui";

const surfaces = [
  {
    href: "/owner",
    label: "Owner App",
    tag: "Surface A",
    desc: "Report damage, get an instant ballpark, dispatch a crew.",
  },
  {
    href: "/pm",
    label: "PM / HOA Portal",
    tag: "Surface B",
    desc: "Master-policy + HO6 coverage-split management.",
  },
  {
    href: "/crm",
    label: "Restoration CRM/ERP",
    tag: "Surface C",
    desc: "Dispatch, estimating, job lifecycle, pricing engine.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-[var(--brand-primary)]">
        FirstCall
      </h1>
      <p className="mt-2 text-neutral-600">
        ERP + CRM for the disaster-restoration industry. Pick a surface:
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {surfaces.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-accent)]">
                {s.tag}
              </span>
              <h2 className="mt-1 font-semibold">{s.label}</h2>
              <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
