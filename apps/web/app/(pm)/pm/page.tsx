import { Card } from "@firstcall/ui";

const stats = [
  { label: "Units enrolled", value: "—" },
  { label: "HO6 verified", value: "—" },
  { label: "Pending", value: "—" },
  { label: "None on file", value: "—" },
];

/** B Coverage-split dashboard (placeholder; Phase 4 wires data). */
export default function PmDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-2xl font-bold text-[var(--brand-primary)]">
              {s.value}
            </p>
            <p className="text-sm text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Master policy</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Upload a policy PDF to parse Master vs HO6 responsibilities (Phase 4).
        </p>
      </Card>
    </div>
  );
}
