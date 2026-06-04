"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Badge, Card, MonoLabel, Stat } from "@firstcall/ui";
import { setClaimStatusAction } from "./jobs/[id]/actions";

type Status = "new" | "dispatched" | "on_site" | "estimate" | "signed";
type Cause = "water" | "fire" | "mold" | "storm" | "other";

type BoardClaim = {
  id: string;
  unitNumber: string | null;
  ownerName: string | null;
  cause: Cause;
  status: string;
  ho6Status: "verified" | "pending" | "none" | null;
  ballparkTotal: number | null;
};

type Metrics = {
  captureRatio: number | null;
  pipelineValue: number;
  totalClaims: number;
};

const COLUMNS: { id: Status; label: string }[] = [
  { id: "new", label: "New" },
  { id: "dispatched", label: "Dispatched" },
  { id: "on_site", label: "On-site" },
  { id: "estimate", label: "Estimate" },
  { id: "signed", label: "Signed" },
];

const CAUSE_TINT: Record<Cause, { c: string; bg: string }> = {
  water: { c: "var(--teal-dark)", bg: "rgba(31,168,160,0.12)" },
  fire: { c: "var(--red)", bg: "rgba(181,82,75,0.12)" },
  mold: { c: "var(--amber)", bg: "rgba(201,138,43,0.14)" },
  storm: { c: "var(--brand-primary)", bg: "rgba(14,42,71,0.08)" },
  other: { c: "var(--gray)", bg: "var(--hover)" },
};

function fmt(cents: number | null): string {
  if (cents == null) return "—";
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}
function shortId(id: string): string {
  return "J-" + id.slice(0, 4).toUpperCase();
}

function Gauge({ value }: { value: number | null }) {
  const v = value ?? 0;
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v / 100);
  const target = 85;
  const tAngle = (target / 100) * 360 - 90;
  const tx = 60 + r * Math.cos((tAngle * Math.PI) / 180);
  const ty = 60 + r * Math.sin((tAngle * Math.PI) / 180);
  const above = value != null && value >= target;
  return (
    <Card className="flex items-center gap-4">
      <div className="relative h-[120px] w-[120px] flex-shrink-0">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(14,42,71,0.08)" strokeWidth="11" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--teal)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
          />
          <circle cx={tx} cy={ty} r="4" fill="var(--brand-accent)" />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-mono text-[26px] font-semibold leading-none text-[var(--brand-primary)]">
              {value == null ? "—" : `${value}%`}
            </div>
            <div className="mt-0.5 text-[10px] text-faint">capture</div>
          </div>
        </div>
      </div>
      <div>
        <MonoLabel>Capture ratio</MonoLabel>
        <div className="mt-1.5 text-[13px] leading-snug text-ink">
          <b style={{ color: above ? "var(--teal)" : "var(--amber)" }}>
            {value == null ? "No decided jobs yet." : above ? "Above target." : "Below target."}
          </b>
          <br />
          <span className="inline-flex items-center gap-1.5 text-gray">
            <span className="h-[7px] w-[7px] rounded-full bg-[var(--brand-accent)]" />
            target ≥ {target}%
          </span>
        </div>
      </div>
    </Card>
  );
}

export function DispatchBoard({
  claims,
  metrics,
}: {
  claims: BoardClaim[];
  metrics: Metrics;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<BoardClaim[]>(claims);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when the server sends fresh data (after a revalidate/refresh).
  useEffect(() => setCards(claims), [claims]);

  const drop = (status: Status) => {
    const id = drag;
    setDrag(null);
    setOver(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    startTransition(async () => {
      await setClaimStatusAction({ claimId: id, status });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Gauge value={metrics.captureRatio} />
        </div>
        <Stat
          n={fmt(metrics.pipelineValue)}
          label="Pipeline value"
          sub={`${cards.length} active jobs`}
          accent="var(--brand-accent)"
        />
        <Stat
          n={metrics.totalClaims.toLocaleString("en-US")}
          label="Total claims"
          sub="this tenant"
        />
      </div>

      <div>
        <MonoLabel className="mb-2.5">
          Live job pipeline · drag to advance a stage · click a card to open its
          estimate
        </MonoLabel>
        <div className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.status === col.id);
            const sum = colCards.reduce((s, c) => s + (c.ballparkTotal ?? 0), 0);
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(col.id);
                }}
                onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
                onDrop={() => drop(col.id)}
                className={
                  "w-[82%] flex-shrink-0 snap-start rounded-card border bg-wash p-2.5 transition-colors sm:w-[280px] lg:w-auto " +
                  (over === col.id
                    ? "border-[var(--brand-accent)] bg-[rgba(232,112,58,0.05)]"
                    : "border-line2")
                }
              >
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <MonoLabel>{col.label}</MonoLabel>
                  <span className="font-mono text-[10.5px] text-faint">
                    {colCards.length} · {fmt(sum)}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {colCards.length ? (
                    colCards.map((c) => (
                      <JobCard
                        key={c.id}
                        card={c}
                        dragging={drag === c.id}
                        onDragStart={() => setDrag(c.id)}
                        onDragEnd={() => {
                          setDrag(null);
                          setOver(null);
                        }}
                        onOpen={() => router.push(`/crm/jobs/${c.id}`)}
                      />
                    ))
                  ) : (
                    <p className="px-1 py-3 text-[11.5px] text-faint">No jobs</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobCard({
  card,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  card: BoardClaim;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const tint = CAUSE_TINT[card.cause] ?? CAUSE_TINT.other;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      title="Open estimate"
      style={{ borderLeft: `3px solid ${tint.c}`, opacity: dragging ? 0.5 : 1 }}
      className="group cursor-pointer rounded-[11px] border border-line bg-card p-3 shadow-sm transition-shadow hover:border-[var(--brand-accent)] hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-faint">
          {shortId(card.id)}
        </span>
        <Badge color={tint.c} bg={tint.bg} className="px-[7px] py-0.5 text-[10px] capitalize">
          {card.cause}
        </Badge>
      </div>
      <div className="mt-1.5 text-[14px] font-bold text-[var(--brand-primary)]">
        {card.unitNumber ? `Unit ${card.unitNumber}` : "Unassigned unit"}
      </div>
      <div className="mt-px text-[11.5px] text-gray">
        {card.ownerName ?? "Owner not on file"}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-mono text-[13px] font-semibold text-[var(--brand-primary)]">
          {fmt(card.ballparkTotal)}
        </span>
        {card.ho6Status ? (
          <span className="font-mono text-[10px] text-faint">
            HO6 {card.ho6Status}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-line2 pt-2 font-mono text-[10.5px] font-semibold text-faint transition-colors group-hover:text-[var(--brand-accent)]">
        Open estimate →
      </div>
    </div>
  );
}
