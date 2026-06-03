"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  BallparkDisclaimer,
  Badge,
  Button,
  Field,
  Input,
  MonoLabel,
  Panel,
} from "@firstcall/ui";
import {
  generateEstimateAction,
  recordJobActualsAction,
  saveEstimateAction,
} from "./actions";

/* ---- display-only data (engine values live server-side in lib/estimate) ---- */
const AREAS = [
  { id: "kitchen", label: "Kitchen" },
  { id: "bath", label: "Bathroom" },
  { id: "bedroom", label: "Bedroom" },
  { id: "living", label: "Living room" },
  { id: "ceiling", label: "Ceilings" },
  { id: "flooring", label: "Flooring" },
];
const CAUSES = ["water", "fire", "mold", "storm"] as const;
const TIERS: [number, number][] = [
  [10, 10],
  [15, 15],
  [20, 20],
];

type Bucket = "master" | "ho6";

type LineItem = {
  id: string;
  code: string;
  description: string;
  qty: number;
  unitPrice: number;
  bucket: Bucket;
};

type EstimateProp = {
  id: string;
  overheadPct: number;
  profitPct: number;
  confidence: number | null;
  flagged: boolean;
  overrideReason: string | null;
} | null;

type ClaimProp = {
  id: string;
  cause: "water" | "fire" | "mold" | "storm" | "other";
  status: string;
  description: string;
  unitNumber: string | null;
  propertyName: string | null;
};

type LearningRow = {
  rawLabor: number;
  rawMaterials: number;
  rawEquipment: number;
  estLaborHours: number;
  actualLabor: number | null;
  actualMaterials: number | null;
  actualEquipment: number | null;
  actualHours: number | null;
} | null;

function fmt(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}
function shortId(id: string): string {
  return "J-" + id.slice(0, 4).toUpperCase();
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function confLabel(score: number | null): "High" | "Medium" | "Low" {
  if (score == null) return "Low";
  return score >= 0.85 ? "High" : score >= 0.65 ? "Medium" : "Low";
}
function parseOverride(reason: string | null): { by: string; reason: string } | null {
  if (!reason) return null;
  const i = reason.indexOf(" — ");
  if (i === -1) return { by: "", reason };
  return { by: reason.slice(0, i), reason: reason.slice(i + 3) };
}

export function EstimateEditor({
  claimId,
  claim,
  estimate,
  lineItems,
  learning,
}: {
  claimId: string;
  claim: ClaimProp;
  estimate: EstimateProp;
  lineItems: LineItem[];
  learning: LearningRow;
}) {
  const router = useRouter();
  const [cause, setCause] = useState(
    CAUSES.includes(claim.cause as (typeof CAUSES)[number])
      ? (claim.cause as (typeof CAUSES)[number])
      : "water",
  );
  const [areas, setAreas] = useState<string[]>(["kitchen", "bedroom", "ceiling"]);
  const [photos, setPhotos] = useState(5);
  const [generating, startGenerate] = useTransition();

  const toggleArea = (id: string) =>
    setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const onGenerate = () => {
    startGenerate(async () => {
      await generateEstimateAction({ claimId, cause, areas, photoCount: photos });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <Link
          href="/crm"
          className="text-[12.5px] font-medium text-gray transition-colors hover:text-[var(--brand-primary)]"
        >
          ← Dispatch Board
        </Link>
        <div className="font-mono text-[11.5px] text-faint">
          {shortId(claimId)} · {claim.propertyName ?? "—"}
          {claim.unitNumber ? ` · Unit ${claim.unitNumber}` : ""}
        </div>
      </div>

      <Panel
        title={`Generate estimate · ${shortId(claimId)}${
          claim.unitNumber ? ` · Unit ${claim.unitNumber}` : ""
        }`}
        right={
          <Badge color="var(--faint)" bg="var(--hover)">
            AI vision + IICRC + price list
          </Badge>
        }
      >
        <div className="grid grid-cols-[1fr_auto] items-end gap-5">
          <div>
            <MonoLabel className="mb-2">Cause of loss</MonoLabel>
            <div className="mb-3.5 flex gap-[7px]">
              {CAUSES.map((cid) => {
                const on = cause === cid;
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => setCause(cid)}
                    className={
                      "rounded-[9px] border px-[13px] py-2 text-[13px] font-semibold capitalize transition-colors " +
                      (on
                        ? "border-[var(--brand-accent)] bg-[rgba(232,112,58,0.1)] text-[var(--brand-accent)]"
                        : "border-line bg-card text-gray hover:text-[var(--brand-primary)]")
                    }
                  >
                    {cid}
                  </button>
                );
              })}
            </div>
            <MonoLabel className="mb-2">Affected areas</MonoLabel>
            <div className="flex flex-wrap gap-[7px]">
              {AREAS.map((a) => {
                const on = areas.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleArea(a.id)}
                    className={
                      "rounded-[9px] border px-3 py-[7px] text-[12.5px] font-medium transition-colors " +
                      (on
                        ? "border-[var(--brand-accent)] bg-[rgba(232,112,58,0.1)] text-[var(--brand-accent)]"
                        : "border-line bg-card text-gray hover:text-[var(--brand-primary)]")
                    }
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-w-[210px] flex-col gap-2.5">
            <div>
              <MonoLabel className="mb-2">Photos from report</MonoLabel>
              <div className="flex items-center justify-between rounded-[9px] border border-line px-2.5 py-[7px]">
                <StepBtn onClick={() => setPhotos((p) => Math.max(0, p - 1))}>−</StepBtn>
                <span className="font-mono text-[13px] text-[var(--brand-primary)]">
                  {photos} photo{photos === 1 ? "" : "s"} · {confLabel(photos >= 5 ? 0.9 : photos >= 2 ? 0.7 : 0.5)}
                </span>
                <StepBtn onClick={() => setPhotos((p) => Math.min(10, p + 1))}>+</StepBtn>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={generating}
              onClick={onGenerate}
            >
              {generating ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : estimate ? (
                "Regenerate estimate"
              ) : (
                "Generate estimate"
              )}
            </Button>
            <p className="text-center text-[11px] leading-snug text-faint">
              Drafts line items, buckets them Master/HO6, applies O&amp;P.
            </p>
          </div>
        </div>
      </Panel>

      {estimate ? (
        <EstimateBody
          key={estimate.id}
          claimId={claimId}
          claim={claim}
          estimate={estimate}
          lineItems={lineItems}
        />
      ) : (
        <Panel title="Estimate">
          <p className="py-6 text-center text-sm text-gray">
            No estimate yet. Pick a cause + affected areas above, then generate
            one to begin bucketing Master vs. HO6.
          </p>
        </Panel>
      )}

      {learning ? <JobActuals claimId={claimId} learning={learning} /> : null}
    </div>
  );
}

/* ------------------------------------------------------ job-close actuals */

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Job close: capture what the job ACTUALLY cost (labor / materials / equipment
 * + hours) against the estimated breakdown captured at generation. This is the
 * est-vs-actual loop that teaches the model what time really costs.
 */
function JobActuals({
  claimId,
  learning,
}: {
  claimId: string;
  learning: NonNullable<LearningRow>;
}) {
  const router = useRouter();
  const closed = learning.actualLabor != null;
  const [labor, setLabor] = useState(
    dollars(learning.actualLabor ?? learning.rawLabor),
  );
  const [materials, setMaterials] = useState(
    dollars(learning.actualMaterials ?? learning.rawMaterials),
  );
  const [equipment, setEquipment] = useState(
    dollars(learning.actualEquipment ?? learning.rawEquipment),
  );
  const [hours, setHours] = useState(
    String(learning.actualHours ?? learning.estLaborHours),
  );
  const [saving, startSave] = useTransition();

  const aLabor = Math.round(Number(labor) * 100) || 0;
  const aMaterials = Math.round(Number(materials) * 100) || 0;
  const aEquipment = Math.round(Number(equipment) * 100) || 0;
  const aHours = Number(hours) || 0;
  const valid =
    Number.isFinite(Number(labor)) &&
    Number.isFinite(Number(materials)) &&
    Number.isFinite(Number(equipment)) &&
    Number.isFinite(Number(hours));

  const onSave = () => {
    startSave(async () => {
      await recordJobActualsAction({
        claimId,
        actualLabor: Number(labor),
        actualMaterials: Number(materials),
        actualEquipment: Number(equipment),
        actualHours: Number(hours),
      });
      router.refresh();
    });
  };

  const estTotal = learning.rawLabor + learning.rawMaterials + learning.rawEquipment;
  const actTotal = aLabor + aMaterials + aEquipment;

  return (
    <Panel
      title="Job close · actual cost"
      right={
        closed ? (
          <Badge color="var(--teal-dark)" bg="rgba(31,168,160,0.12)">
            recorded
          </Badge>
        ) : (
          <Badge color="var(--faint)" bg="var(--hover)">
            awaiting actuals
          </Badge>
        )
      }
    >
      <p className="mb-3.5 text-[12.5px] leading-relaxed text-gray">
        Enter what the job actually cost. The system compares it to the estimated
        breakdown to learn what <b className="text-[var(--brand-primary)]">time</b>{" "}
        really costs against work, material &amp; equipment.
      </p>

      <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] gap-2.5 text-[12px]">
        <div />
        <div className="font-mono text-[10.5px] tracking-[0.05em] text-faint">
          ESTIMATED
        </div>
        <div className="font-mono text-[10.5px] tracking-[0.05em] text-faint">
          ACTUAL ($)
        </div>
        <div className="font-mono text-[10.5px] tracking-[0.05em] text-faint">
          Δ VARIANCE
        </div>

        <ActualRow
          label="Labor"
          estCents={learning.rawLabor}
          actCents={aLabor}
          value={labor}
          onChange={setLabor}
        />
        <ActualRow
          label="Materials"
          estCents={learning.rawMaterials}
          actCents={aMaterials}
          value={materials}
          onChange={setMaterials}
        />
        <ActualRow
          label="Equipment"
          estCents={learning.rawEquipment}
          actCents={aEquipment}
          value={equipment}
          onChange={setEquipment}
        />
      </div>

      <div className="mt-3.5 grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-2.5">
        <span className="text-[13px] font-semibold text-[var(--brand-primary)]">
          Labor hours
        </span>
        <span className="font-mono text-[13px] text-gray">
          {learning.estLaborHours}h
        </span>
        <Input
          value={hours}
          inputMode="decimal"
          onChange={(e) => setHours(e.target.value)}
        />
        <Variance est={learning.estLaborHours} act={aHours} suffix="h" />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-card bg-wash px-4 py-3">
        <div className="font-mono text-[12px] text-gray">
          Raw total — est {fmt(estTotal)} → actual {fmt(actTotal)}
        </div>
        <Button variant="primary" disabled={saving || !valid} onClick={onSave}>
          {saving ? "Saving…" : closed ? "Update actuals" : "Record actuals & close"}
        </Button>
      </div>
    </Panel>
  );
}

function ActualRow({
  label,
  estCents,
  actCents,
  value,
  onChange,
}: {
  label: string;
  estCents: number;
  actCents: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <span className="self-center text-[13px] font-semibold text-[var(--brand-primary)]">
        {label}
      </span>
      <span className="self-center font-mono text-[13px] text-gray">
        {fmt(estCents)}
      </span>
      <Input
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
      />
      <Variance est={estCents} act={actCents} money />
    </>
  );
}

function Variance({
  est,
  act,
  money,
  suffix,
}: {
  est: number;
  act: number;
  money?: boolean;
  suffix?: string;
}) {
  const delta = act - est;
  const pct = est > 0 ? Math.round((delta / est) * 100) : null;
  const color =
    delta === 0
      ? "var(--faint)"
      : Math.abs(pct ?? 0) > 15
        ? "var(--red)"
        : "var(--teal-dark)";
  const shown = money ? fmt(Math.abs(delta)) : `${Math.abs(delta)}${suffix ?? ""}`;
  return (
    <span
      className="self-center font-mono text-[12.5px] font-medium"
      style={{ color }}
    >
      {delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${shown}`}
      {pct != null && delta !== 0 ? (
        <span className="ml-1 text-[10.5px] text-faint">
          ({pct > 0 ? "+" : ""}
          {pct}%)
        </span>
      ) : null}
    </span>
  );
}

/* ----------------------------------------------------------- estimate body */

function EstimateBody({
  claimId,
  claim,
  estimate,
  lineItems,
}: {
  claimId: string;
  claim: ClaimProp;
  estimate: NonNullable<EstimateProp>;
  lineItems: LineItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>(lineItems);
  const [oh, setOh] = useState(estimate.overheadPct);
  const [profit, setProfit] = useState(estimate.profitPct);
  const [override, setOverride] = useState(parseOverride(estimate.overrideReason));
  const [modal, setModal] = useState(false);
  const [saving, startSave] = useTransition();

  const flagged = oh > 20 || profit > 20;
  const rate = (oh + profit) / 100;
  const master = items.filter((i) => i.bucket === "master");
  const ho6 = items.filter((i) => i.bucket === "ho6");
  const rawMaster = master.reduce((s, i) => s + Math.round(i.qty * i.unitPrice), 0);
  const rawHo6 = ho6.reduce((s, i) => s + Math.round(i.qty * i.unitPrice), 0);
  const raw = rawMaster + rawHo6;
  const total = Math.round(raw * (1 + rate));
  const masterTotal = Math.round(rawMaster * (1 + rate));
  const ho6Total = Math.round(rawHo6 * (1 + rate));
  const conf = confLabel(estimate.confidence);

  const baseline = useMemo(
    () =>
      JSON.stringify({
        b: lineItems.map((i) => [i.id, i.bucket]),
        oh: estimate.overheadPct,
        p: estimate.profitPct,
        o: parseOverride(estimate.overrideReason),
      }),
    [lineItems, estimate],
  );
  const current = JSON.stringify({
    b: items.map((i) => [i.id, i.bucket]),
    oh,
    p: profit,
    o: flagged ? override : null,
  });
  const dirty = current !== baseline;

  const move = (id: string) =>
    setItems((arr) =>
      arr.map((it) =>
        it.id === id
          ? { ...it, bucket: it.bucket === "master" ? "ho6" : "master" }
          : it,
      ),
    );

  const setTier = (o: number, p: number) => {
    setOh(o);
    setProfit(p);
    setOverride(null);
  };

  const onSave = () => {
    startSave(async () => {
      await saveEstimateAction({
        estimateId: estimate.id,
        claimId,
        buckets: items.map((i) => ({ id: i.id, bucket: i.bucket })),
        oh,
        profit,
        override: flagged ? override : null,
      });
      router.refresh();
    });
  };

  const confColor =
    conf === "High" ? "var(--teal)" : conf === "Medium" ? "var(--amber)" : "var(--red)";
  const confBg =
    conf === "High"
      ? "rgba(31,168,160,0.12)"
      : conf === "Medium"
        ? "rgba(201,138,43,0.14)"
        : "rgba(181,82,75,0.12)";

  return (
    <>
      <div className="grid grid-cols-[1.7fr_1fr] items-start gap-[18px]">
        <Panel
          title={`Estimate · ${shortId(claimId)}${
            claim.unitNumber ? ` · Unit ${claim.unitNumber}` : ""
          } (${cap(claim.cause)})`}
          right={
            <Badge color={confColor} bg={confBg}>
              {conf} confidence
            </Badge>
          }
        >
          <BallparkDisclaimer className="mb-3.5" />
          <p className="mb-3.5 flex items-center gap-2.5 text-[12.5px] text-gray">
            <span className="font-mono text-[14px] font-semibold text-[var(--brand-accent)]">
              ⇄
            </span>
            Tap the{" "}
            <b className="text-[var(--brand-accent)]">⇄</b> on any line to move it
            between the Master policy and the owner&apos;s HO6 — the
            dispute-resolution moment, in one action.
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            <BucketCol
              title="MASTER (HOA)"
              tint="var(--brand-primary)"
              bg="rgba(14,42,71,0.05)"
              items={master}
              total={masterTotal}
              side="master"
              onMove={move}
            />
            <BucketCol
              title="HO6 (UNIT OWNER)"
              tint="var(--teal-dark)"
              bg="rgba(31,168,160,0.08)"
              items={ho6}
              total={ho6Total}
              side="ho6"
              onMove={move}
            />
          </div>
          <div className="mt-4 flex justify-between rounded-card bg-[var(--brand-primary)] px-4 py-3.5 text-white">
            <div>
              <div className="font-mono text-[11px] tracking-[0.06em] text-white/60">
                BALLPARK TOTAL
              </div>
              <div className="mt-0.5 font-mono text-[28px] font-semibold">
                {fmt(total)}
              </div>
            </div>
            <div className="text-right font-mono text-[12px] leading-[1.7] text-[#9fb2c4]">
              <div>Raw {fmt(raw)}</div>
              <div>
                O&amp;P {oh}/{profit} · {fmt(total - raw)}
              </div>
              <div className="text-white">
                Master {fmt(masterTotal)} · HO6 {fmt(ho6Total)}
              </div>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-[18px]">
          <Panel
            title="O&P guardrail"
            right={
              flagged ? (
                <Badge color="var(--red)" bg="rgba(181,82,75,0.12)">
                  ⚠ flagged
                </Badge>
              ) : (
                <Badge color="var(--teal-dark)" bg="rgba(31,168,160,0.12)">
                  within tiers
                </Badge>
              )
            }
          >
            <MonoLabel className="mb-2.5">Standard tiers</MonoLabel>
            <div className="mb-3.5 flex gap-2">
              {TIERS.map(([o, p]) => {
                const on = oh === o && profit === p && !flagged;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setTier(o, p)}
                    className={
                      "flex-1 rounded-control border py-[9px] font-mono text-[13px] font-semibold transition-colors " +
                      (on
                        ? "border-[var(--brand-accent)] bg-[rgba(232,112,58,0.1)] text-[var(--brand-accent)]"
                        : "border-line bg-card text-gray hover:text-[var(--brand-primary)]")
                    }
                  >
                    {o}/{p}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2.5">
              <OPStepper
                label="Overhead"
                value={oh}
                flagged={oh > 20}
                onChange={(v) => {
                  setOh(v);
                  setOverride(null);
                }}
              />
              <OPStepper
                label="Profit"
                value={profit}
                flagged={profit > 20}
                onChange={(v) => {
                  setProfit(v);
                  setOverride(null);
                }}
              />
            </div>

            {flagged && !override ? (
              <div className="mt-3.5 rounded-card border border-[rgba(181,82,75,0.3)] bg-[rgba(181,82,75,0.07)] p-3">
                <div className="flex items-center gap-[7px] text-[13px] font-bold text-red">
                  ⚠ O&amp;P set to {oh}/{profit}
                </div>
                <p className="my-[6px] mb-[11px] text-[12px] leading-snug text-[#8e423c]">
                  Above standard tiers (max 20/20). Confirm this isn&apos;t
                  excessive — overrides are logged and quarantined from the
                  learning baseline.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => setModal(true)}
                  >
                    Admin override
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setTier(20, 20)}
                  >
                    Adjust to 20/20
                  </Button>
                </div>
              </div>
            ) : null}

            {flagged && override ? (
              <div className="mt-3.5 rounded-card border border-[rgba(201,138,43,0.3)] bg-[rgba(201,138,43,0.08)] p-3">
                <div className="flex items-center gap-[7px] text-[13px] font-bold text-amber">
                  ✓ Override logged
                </div>
                <p className="mt-[6px] text-[12px] leading-snug text-[#8a6a22]">
                  Approved by <b>{override.by || "admin"}</b> — “{override.reason}”.
                  This job is quarantined from the normalized learning baseline.
                </p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Learning baseline">
            <p className="text-[13px] leading-relaxed text-gray">
              On sign-off, this job is stripped of{" "}
              <b className="text-[var(--brand-primary)]">O&amp;P, tax &amp; markup</b>{" "}
              down to raw labor + materials + equipment, then normalized by
              market and written to the shared model.
            </p>
            <div className="mt-3 flex gap-2.5">
              <div className="flex-1 rounded-control border border-line2 bg-wash px-3 py-2.5">
                <div className="font-mono text-[18px] font-semibold text-[var(--brand-primary)]">
                  {fmt(raw)}
                </div>
                <div className="text-[11px] text-faint">raw → baseline</div>
              </div>
              <div className="flex-1 rounded-control border border-line2 bg-wash px-3 py-2.5">
                <div
                  className="font-mono text-[18px] font-semibold"
                  style={{ color: flagged ? "var(--red)" : "var(--teal)" }}
                >
                  {flagged ? "Excluded" : "Included"}
                </div>
                <div className="text-[11px] text-faint">
                  {flagged ? "outlier quarantine" : "normalized"}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {dirty ? (
        <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-card border border-line bg-card px-4 py-3 shadow-md">
          <span className="text-[12.5px] text-gray">
            Unsaved changes to buckets / O&amp;P.
            {flagged && !override ? (
              <span className="ml-1 font-semibold text-red">
                Resolve the O&amp;P flag before saving.
              </span>
            ) : null}
          </span>
          <Button
            variant="primary"
            disabled={saving || (flagged && !override)}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save estimate"}
          </Button>
        </div>
      ) : null}

      <OverrideModal
        open={modal}
        oh={oh}
        profit={profit}
        onClose={() => setModal(false)}
        onConfirm={(by, reason) => {
          setOverride({ by, reason });
          setModal(false);
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------- sub-pieces */

function StepBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-card text-[17px] font-semibold leading-none text-[var(--brand-primary)] transition-colors hover:bg-[var(--hover)]"
    >
      {children}
    </button>
  );
}

function OPStepper({
  label,
  value,
  flagged,
  onChange,
}: {
  label: string;
  value: number;
  flagged: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-control border px-3 py-[9px]"
      style={{
        borderColor: flagged ? "var(--red)" : "var(--line)",
        background: flagged ? "rgba(181,82,75,0.05)" : "var(--card)",
      }}
    >
      <span className="text-[13px] font-semibold text-[var(--brand-primary)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <StepBtn onClick={() => onChange(Math.max(0, value - 5))}>−</StepBtn>
        <span
          className="min-w-9 text-center font-mono text-[15px] font-semibold"
          style={{ color: flagged ? "var(--red)" : "var(--brand-primary)" }}
        >
          {value}%
        </span>
        <StepBtn onClick={() => onChange(Math.min(40, value + 5))}>+</StepBtn>
      </div>
    </div>
  );
}

function BucketCol({
  title,
  tint,
  bg,
  items,
  total,
  side,
  onMove,
}: {
  title: string;
  tint: string;
  bg: string;
  items: LineItem[];
  total: number;
  side: Bucket;
  onMove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-wash">
      <div
        className="flex items-center justify-between border-b border-line2 px-3.5 py-[11px]"
        style={{ background: bg }}
      >
        <span
          className="font-mono text-[11.5px] font-semibold tracking-[0.05em]"
          style={{ color: tint }}
        >
          {title}
        </span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: tint }}>
          {fmt(total)}
        </span>
      </div>
      <div className="flex min-h-20 flex-1 flex-col gap-[7px] p-2.5">
        {items.length ? (
          items.map((it) => (
            <LineRow key={it.id} it={it} side={side} onMove={onMove} />
          ))
        ) : (
          <div className="grid flex-1 place-items-center text-[12px] text-faint">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

function LineRow({
  it,
  side,
  onMove,
}: {
  it: LineItem;
  side: Bucket;
  onMove: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-2.5 rounded-control border border-line2 bg-card p-2.5 transition-colors hover:border-line hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] leading-tight text-ink">{it.description}</div>
        <div className="mt-px font-mono text-[10px] text-faint">
          {it.qty > 1 ? `${it.qty} × ${fmt(it.unitPrice)}` : it.code}
        </div>
      </div>
      <span className="font-mono text-[12.5px] font-medium text-[var(--brand-primary)]">
        {fmt(Math.round(it.qty * it.unitPrice))}
      </span>
      <button
        type="button"
        title={
          side === "master" ? "Move to HO6 (owner)" : "Move to Master (HOA)"
        }
        onClick={() => onMove(it.id)}
        className="grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-[7px] border border-line bg-card font-mono text-[13px] font-semibold text-[var(--brand-accent)] transition-colors group-hover:bg-[var(--brand-accent)] group-hover:text-white"
      >
        ⇄
      </button>
    </div>
  );
}

function OverrideModal({
  open,
  oh,
  profit,
  onClose,
  onConfirm,
}: {
  open: boolean;
  oh: number;
  profit: number;
  onClose: () => void;
  onConfirm: (by: string, reason: string) => void;
}) {
  const [by, setBy] = useState("");
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card border border-line bg-card p-5 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[17px] font-bold text-[var(--brand-primary)]">
          Admin override
        </div>
        <div className="mb-4 text-[12.5px] text-gray">
          Approving non-standard O&amp;P of {oh}/{profit}
        </div>
        <p className="mb-4 rounded-control border border-[rgba(181,82,75,0.25)] bg-[rgba(181,82,75,0.06)] px-3 py-2.5 text-[12.5px] leading-snug text-[#8e423c]">
          Overrides are recorded against your name and excluded from the
          learning baseline (kept for analysis only — trauma, travel,
          high-risk).
        </p>
        <div className="flex flex-col gap-3">
          <Field label="Admin name">
            <Input
              value={by}
              onChange={(e) => setBy(e.target.value)}
              placeholder="e.g. J. Okafor"
            />
          </Field>
          <Field
            label="Reason (required)"
            hint="Why is this O&P justified for this job?"
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Trauma scene with biohazard remediation and after-hours crew."
              className="min-h-[84px] w-full resize-none rounded-control border border-line bg-card px-3 py-2.5 text-sm leading-snug text-ink outline-none transition-colors focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[rgba(232,112,58,0.15)]"
            />
          </Field>
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!by.trim() || !reason.trim()}
              onClick={() => onConfirm(by.trim(), reason.trim())}
            >
              Log override
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
