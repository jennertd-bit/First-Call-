"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { BallparkDisclaimer, Button } from "@firstcall/ui";
import type { CauseOfLoss, OwnerRole } from "@firstcall/types";
import { createOwnerClaimAction, dispatchOwnerClaimAction } from "./actions";
import {
  CAUSE_ICONS,
  IconArrow,
  IconBack,
  IconBolt,
  IconCamera,
  IconCheck,
  IconClose,
  IconCube,
  IconDoc,
  IconHome,
  IconLink,
  IconPhone,
  IconShield,
  IconSpark,
  IconStar,
  IconTruck,
  IconUser,
  IconUsers,
  IconVideo,
} from "./icons";

const ACCENT = "var(--brand-accent)";
const ACCENT_30 = "rgba(232,112,58,0.30)";
const ACCENT_12 = "rgba(232,112,58,0.12)";
const ACCENT_10 = "rgba(232,112,58,0.10)";

type OwnerBallpark = Awaited<ReturnType<typeof createOwnerClaimAction>>;
type Media = { id: string; kind: "photo" | "video" | "scan" | "link"; name: string; url: string | null };
type Cause = { id: CauseOfLoss; label: string };
type Area = { id: string; label: string };

const SAMPLE_MATTERPORT = "https://my.matterport.com/show/?m=demo3Dscan";

const CAUSE_COPY: Record<string, string> = {
  water: "Leak, flood, burst pipe",
  fire: "Fire, smoke, soot",
  mold: "Mold or mildew",
  storm: "Wind, hail, fallen tree",
  other: "Something else",
};

const ROLES: { id: OwnerRole; label: string; sub: string; Icon: (p: { s?: number }) => ReactNode }[] = [
  { id: "hoa", label: "HOA / Board contact", sub: "Reporting for the association", Icon: IconUsers },
  { id: "unit_owner", label: "Unit owner", sub: "I own this unit", Icon: IconUser },
  { id: "tenant", label: "Tenant", sub: "I rent · I'll loop in the owner", Icon: IconHome },
];

function fmt(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}
function uid() {
  return "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
}

/* ----------------------------------------------------------- primitives */

function Screen({ footer, children }: { footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      {footer ? (
        <div className="sticky bottom-0 border-t border-line bg-paper/95 px-5 py-3.5 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={"px-5 pb-6 " + (className ?? "")}>{children}</div>;
}

function Header({
  title,
  brand,
  tenant,
  onBack,
  right,
}: {
  title?: string;
  brand?: boolean;
  tenant?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pb-2 pt-6">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-control border border-line bg-card text-navy transition-colors hover:bg-[var(--hover)]"
        >
          <IconBack s={18} />
        </button>
      ) : null}
      {brand ? (
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 place-items-center rounded-[11px] font-mono text-[17px] font-bold text-white"
            style={{ background: ACCENT }}
          >
            {(tenant ?? "F").charAt(0)}
          </div>
          <div>
            <div className="text-[15px] font-bold leading-none text-navy">{tenant}</div>
            <div className="mono-label mt-1 text-[10px]">The first call</div>
          </div>
        </div>
      ) : (
        <h1 className="flex-1 text-[16px] font-bold text-navy">{title}</h1>
      )}
      {right === undefined ? <div className="ml-auto" /> : right}
    </div>
  );
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={"mono-label " + (className ?? "")}>{children}</div>;
}

function OwnerCard({
  sel,
  onClick,
  className,
  style,
  children,
}: {
  sel?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={
        "rounded-card border bg-card p-[18px] shadow-sm transition-[border-color,box-shadow] " +
        (onClick ? "cursor-pointer " : "") +
        (sel ? "border-[var(--brand-accent)] " : "border-line ") +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}

function Steps({ n }: { n: number }) {
  return (
    <div className="flex gap-1.5 px-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[3px] flex-1 rounded-full transition-colors"
          style={{ background: i <= n ? ACCENT : "var(--line)" }}
        />
      ))}
    </div>
  );
}

function FullBtn({
  children,
  variant = "primary",
  icon,
  ...props
}: React.ComponentProps<typeof Button> & { icon?: ReactNode }) {
  return (
    <Button variant={variant} size="lg" className="w-full" {...props}>
      {children}
      {icon}
    </Button>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={bold ? "text-[14.5px] font-semibold text-navy" : "text-[12.5px] text-gray"}>{k}</span>
      <span
        className={
          "font-mono text-navy " + (bold ? "text-[16px] font-semibold" : "text-[12.5px] font-medium")
        }
      >
        {v}
      </span>
    </div>
  );
}

function ConfPill({ level }: { level: "High" | "Medium" | "Low" }) {
  const map = {
    High: { c: "var(--teal)", bg: "rgba(31,168,160,0.14)" },
    Medium: { c: "var(--amber)", bg: "rgba(201,138,43,0.14)" },
    Low: { c: "var(--red)", bg: "rgba(181,82,75,0.14)" },
  } as const;
  const { c, bg } = map[level];
  return (
    <span
      className="rounded-full px-[9px] py-[3px] font-mono text-[10.5px] font-semibold tracking-[0.06em]"
      style={{ color: c, background: bg }}
    >
      {level.toUpperCase()} CONFIDENCE
    </span>
  );
}

/* --------------------------------------------------------------- screens */

function HomeScreen({
  msa,
  tenant,
  vendor,
  onReport,
}: {
  msa: boolean;
  tenant: string;
  vendor: string;
  onReport: () => void;
}) {
  return (
    <Screen>
      <Header brand tenant={tenant} />
      <Body>
        {msa ? (
          <div className="mb-[18px] flex items-center gap-2.5 rounded-[14px] border border-[rgba(31,168,160,0.3)] bg-[rgba(31,168,160,0.1)] px-3.5 py-3">
            <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-[9px] bg-teal text-white">
              <IconShield s={17} />
            </div>
            <div className="text-[13px] leading-snug text-ink">
              <b className="text-navy">Covered by {vendor}</b>
              <div className="mt-px font-mono text-[10.5px] tracking-[0.04em] text-teal-dark">
                ACTIVE MSA · PRIORITY DISPATCH
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-[18px] flex items-center gap-2.5 rounded-[14px] border border-line bg-[var(--hover)] px-3.5 py-3">
            <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-[9px] bg-navy text-white">
              <IconStar s={16} />
            </div>
            <div className="text-[13px] leading-snug text-ink">
              <b className="text-navy">No vendor on file</b>
              <div className="mt-px font-mono text-[10.5px] tracking-[0.04em] text-faint">
                WE&apos;LL ROUTE A TOP-RATED LOCAL CREW
              </div>
            </div>
          </div>
        )}

        <Label>Emergency?</Label>
        <div
          onClick={onReport}
          className="relative mt-2.5 cursor-pointer overflow-hidden rounded-card px-[22px] py-[26px]"
          style={{ background: ACCENT, boxShadow: `0 14px 36px ${ACCENT_30}` }}
        >
          <div className="absolute -right-7 -top-7 h-[150px] w-[150px] rounded-full bg-white/10" />
          <div className="relative">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-white/[0.18] text-white">
              <IconBolt s={30} />
            </div>
            <div className="text-[25px] font-bold leading-[1.1] tracking-[-0.02em] text-white">
              Report damage
            </div>
            <div className="mt-1.5 max-w-[24ch] text-[14px] leading-snug text-white/90">
              One tap. Get an instant ballpark and a crew on the way.
            </div>
            <div className="mt-[18px] flex items-center gap-[7px] font-mono text-[12px] font-semibold tracking-[0.04em] text-white">
              START A CLAIM <IconArrow s={16} />
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3">
          <OwnerCard className="p-4">
            <div className="mb-2 text-faint">
              <IconHome s={20} />
            </div>
            <div className="text-[13.5px] font-semibold text-navy">Active claims</div>
            <div className="mt-0.5 text-[12px] text-faint">None open</div>
          </OwnerCard>
          <OwnerCard className="p-4">
            <div className="mb-2 text-teal">
              <IconPhone s={20} />
            </div>
            <div className="text-[13.5px] font-semibold text-navy">24/7 line</div>
            <div className="mt-0.5 text-[12px] text-faint">Talk to a person</div>
          </OwnerCard>
        </div>

        <div className="mt-[18px] text-center font-mono text-[10.5px] tracking-[0.05em] text-faint">
          POWERED BY FIRSTCALL · AI + IICRC PRICING
        </div>
      </Body>
    </Screen>
  );
}

function RoleScreen({
  role,
  setRole,
  onBack,
  onNext,
}: {
  role: OwnerRole | null;
  setRole: (r: OwnerRole) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Screen
      footer={
        <FullBtn variant="dark" disabled={!role} onClick={onNext} icon={<IconArrow s={18} />}>
          Continue
        </FullBtn>
      }
    >
      <Header title="Report damage" onBack={onBack} />
      <Body>
        <h2 className="text-[24px] font-bold leading-[1.12] tracking-[-0.02em] text-navy">
          Who&apos;s reporting?
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-gray">
          This sets how coverage is split between the building&apos;s master policy and your unit.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {ROLES.map(({ id, label, sub, Icon }) => {
            const on = role === id;
            return (
              <OwnerCard
                key={id}
                sel={on}
                onClick={() => setRole(id)}
                className="flex items-center gap-3.5 p-4"
              >
                <div
                  className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[13px] transition-colors"
                  style={{
                    background: on ? ACCENT : "rgba(14,42,71,0.05)",
                    color: on ? "#fff" : "var(--navy)",
                  }}
                >
                  <Icon s={23} />
                </div>
                <div className="flex-1">
                  <div className="text-[15.5px] font-semibold text-navy">{label}</div>
                  <div className="mt-0.5 text-[12.5px] text-faint">{sub}</div>
                </div>
                <div
                  className="grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full border-[1.5px] text-white"
                  style={{
                    borderColor: on ? ACCENT : "var(--line)",
                    background: on ? ACCENT : "transparent",
                  }}
                >
                  {on ? <IconCheck s={14} /> : null}
                </div>
              </OwnerCard>
            );
          })}
        </div>
        {role === "unit_owner" ? (
          <div className="mt-4 rounded-[13px] border border-[rgba(31,168,160,0.28)] bg-[rgba(31,168,160,0.09)] px-3.5 py-3 text-[12.5px] leading-relaxed text-teal-dark">
            <b>HO6 separation on.</b> We&apos;ll keep your unit-owner costs (paint, finishes, flooring)
            separate from the master policy automatically.
          </div>
        ) : null}
      </Body>
    </Screen>
  );
}

function AddBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed border-line bg-[rgba(14,42,71,0.025)] px-1.5 py-3.5 text-navy transition-colors hover:bg-[var(--hover)]"
    >
      <span className="text-gray">{icon}</span>
      <span className="text-[12px] font-semibold">{label}</span>
    </button>
  );
}

function IntakeScreen({
  causes,
  areas,
  cause,
  setCause,
  selectedAreas,
  toggleArea,
  media,
  addMedia,
  rmMedia,
  note,
  setNote,
  onBack,
  onSubmit,
}: {
  causes: Cause[];
  areas: Area[];
  cause: CauseOfLoss | null;
  setCause: (c: CauseOfLoss) => void;
  selectedAreas: string[];
  toggleArea: (id: string) => void;
  media: Media[];
  addMedia: (items: Media[]) => void;
  rmMedia: (id: string) => void;
  note: string;
  setNote: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkVal, setLinkVal] = useState("");
  const stepN = (cause ? 1 : 0) + (media.length ? 1 : 0) + (selectedAreas.length || note ? 1 : 0);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>, kind: "photo" | "video") => {
    const files = [...(e.target.files ?? [])];
    addMedia(
      files.map((f) => ({
        id: uid(),
        kind,
        name: f.name,
        url: URL.createObjectURL(f),
      })),
    );
    e.target.value = "";
  };
  const addLink = () => {
    const v = linkVal.trim();
    if (!v) return;
    const isScan = /matterport|\/show|3d|scan/i.test(v);
    let host = v;
    try {
      host = new URL(v).hostname.replace("www.", "");
    } catch {
      /* keep raw */
    }
    addMedia([{ id: uid(), kind: isScan ? "scan" : "link", name: isScan ? "Matterport 3D scan" : host, url: v }]);
    setLinkVal("");
    setLinkOpen(false);
  };

  const visualMedia = media.filter((m) => m.kind === "photo" || m.kind === "video");
  const linkMedia = media.filter((m) => m.kind === "scan" || m.kind === "link");

  return (
    <Screen
      footer={
        <FullBtn disabled={!cause} onClick={onSubmit} icon={<IconSpark s={18} />}>
          Get my ballpark
        </FullBtn>
      }
    >
      <Header title="Tell us what happened" onBack={onBack} />
      <Steps n={stepN} />
      <Body className="pt-4">
        <Label>1 · Cause of loss</Label>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {causes.map((c) => {
            const on = cause === c.id;
            const Icon = CAUSE_ICONS[c.id] ?? CAUSE_ICONS.other!;
            return (
              <OwnerCard
                key={c.id}
                sel={on}
                onClick={() => setCause(c.id)}
                className={"flex items-center gap-3 p-3.5 " + (c.id === "other" ? "col-span-2" : "")}
              >
                <div
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[12px] transition-colors"
                  style={{
                    background: on ? ACCENT : "rgba(14,42,71,0.05)",
                    color: on ? "#fff" : "var(--navy)",
                  }}
                >
                  <Icon s={22} />
                </div>
                <div>
                  <div className="text-[14.5px] font-semibold text-navy">{c.label}</div>
                  <div className="mt-px text-[11px] text-faint">{CAUSE_COPY[c.id]}</div>
                </div>
              </OwnerCard>
            );
          })}
        </div>

        <Label className="mt-6">
          2 · Add evidence <span className="text-faint">· {media.length} item{media.length === 1 ? "" : "s"}</span>
        </Label>
        <input ref={photoRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e, "photo")} className="hidden" />
        <input ref={videoRef} type="file" accept="video/*" multiple onChange={(e) => onFiles(e, "video")} className="hidden" />
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <AddBtn icon={<IconCamera s={18} />} label="Photos" onClick={() => photoRef.current?.click()} />
          <AddBtn icon={<IconVideo s={18} />} label="Video" onClick={() => videoRef.current?.click()} />
          <AddBtn
            icon={<IconCube s={18} />}
            label="Matterport"
            onClick={() => {
              setLinkOpen(true);
              setLinkVal(SAMPLE_MATTERPORT);
            }}
          />
        </div>
        {linkOpen ? (
          <div className="mt-2.5 flex gap-2">
            <input
              value={linkVal}
              onChange={(e) => setLinkVal(e.target.value)}
              placeholder="Paste a Matterport or any link…"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && addLink()}
              className="min-w-0 flex-1 rounded-[11px] border border-line bg-card px-3 py-[11px] text-[13px] text-ink outline-none"
            />
            <Button variant="dark" onClick={addLink} className="px-4">
              Add
            </Button>
          </div>
        ) : null}
        {visualMedia.length ? (
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {visualMedia.map((m) => (
              <div
                key={m.id}
                className="relative aspect-square overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                style={{
                  background:
                    m.kind === "photo" && m.url
                      ? `center/cover no-repeat url(${m.url})`
                      : "linear-gradient(135deg,#37475a,#1b2733)",
                }}
              >
                <button
                  onClick={() => rmMedia(m.id)}
                  aria-label="Remove"
                  className="absolute right-1 top-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-black/55 text-white"
                >
                  <IconClose s={11} />
                </button>
                <div className="absolute bottom-1 left-1.5 text-white/90">
                  {m.kind === "video" ? <IconVideo s={13} /> : <IconCamera s={13} />}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {linkMedia.map((m) => (
          <div
            key={m.id}
            className="mt-2 flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5"
            style={{
              background: m.kind === "scan" ? "rgba(31,168,160,0.08)" : "var(--card)",
              borderColor: m.kind === "scan" ? "rgba(31,168,160,0.3)" : "var(--line)",
            }}
          >
            <div className="flex-shrink-0" style={{ color: m.kind === "scan" ? "var(--teal)" : "var(--navy)" }}>
              {m.kind === "scan" ? <IconCube s={18} /> : <IconLink s={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-navy">{m.name}</div>
              <div className="truncate font-mono text-[10.5px] text-faint">{m.url}</div>
            </div>
            <button
              onClick={() => rmMedia(m.id)}
              aria-label="Remove"
              className="grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-md bg-[rgba(14,42,71,0.06)] text-gray"
            >
              <IconClose s={12} />
            </button>
          </div>
        ))}
        <div className="mt-2 text-[11.5px] leading-snug text-faint">
          Photos, video, or a Matterport / 3D scan — by file or link. Richer evidence sharpens the estimate.
        </div>

        <Label className="mt-6">3 · What&apos;s affected?</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {areas.map((a) => {
            const on = selectedAreas.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleArea(a.id)}
                className="rounded-[11px] border px-3.5 py-[9px] text-[13.5px] font-medium transition-colors"
                style={{
                  borderColor: on ? ACCENT : "var(--line)",
                  background: on ? ACCENT : "var(--card)",
                  color: on ? "#fff" : "var(--ink)",
                  boxShadow: on ? `0 4px 12px ${ACCENT_30}` : "var(--shadow-sm)",
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else we should know? (optional)"
          className="mt-3.5 min-h-[78px] w-full resize-none rounded-[14px] border border-line bg-card px-3.5 py-3 text-[14px] leading-relaxed text-ink shadow-sm outline-none"
        />
      </Body>
    </Screen>
  );
}

const THINK_STEPS = [
  "Reading your evidence",
  "Classifying damage & affected materials",
  "Matching IICRC drying standards",
  "Pricing against your vendor's T&M list",
  "Applying O&P tier & coverage split",
];

function ThinkingScreen({ reduceMotion, onDone }: { reduceMotion: boolean; onDone: () => void }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const gap = reduceMotion ? 130 : 620;
    const timers = THINK_STEPS.map((_, i) => setTimeout(() => setDone(i + 1), gap * (i + 1)));
    const fin = setTimeout(onDone, gap * (THINK_STEPS.length + 1.2));
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(fin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="flex min-h-screen flex-col justify-center px-5"
      style={{ background: "linear-gradient(160deg, var(--navy), #091a2c 78%)" }}
    >
      <div className="mb-[30px] grid place-items-center">
        <div
          className="fc-pulse grid h-[86px] w-[86px] place-items-center rounded-[26px] text-white"
          style={{
            background: ACCENT,
            boxShadow: `0 0 0 12px rgba(255,255,255,0.04), 0 16px 40px ${ACCENT_30}`,
            animation: reduceMotion ? "none" : "fcPulse 1.6s ease-in-out infinite",
          }}
        >
          <IconSpark s={42} />
        </div>
      </div>
      <div className="mb-[26px] text-center">
        <div className="text-[22px] font-bold tracking-[-0.02em] text-white">Building your ballpark</div>
        <div className="mt-1.5 text-[13.5px] text-[#9fb2c4]">
          AI vision + IICRC standards + your vendor&apos;s pricing
        </div>
      </div>
      <div className="flex flex-col gap-[11px]">
        {THINK_STEPS.map((s, i) => {
          const isDone = i < done;
          const active = i === done;
          return (
            <div
              key={i}
              className="flex items-center gap-3 transition-opacity"
              style={{ opacity: isDone || active ? 1 : 0.4 }}
            >
              <div
                className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-white transition-all"
                style={{
                  background: isDone ? "var(--teal)" : "rgba(255,255,255,0.1)",
                  border: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                }}
              >
                {isDone ? (
                  <IconCheck s={14} />
                ) : active && !reduceMotion ? (
                  <div
                    className="fc-blink h-[7px] w-[7px] rounded-full"
                    style={{ background: ACCENT, animation: "fcBlink 0.9s infinite" }}
                  />
                ) : null}
              </div>
              <div
                className="text-[14px]"
                style={{ color: isDone ? "#cdd9e6" : "#fff", fontWeight: active ? 600 : 400 }}
              >
                {s}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BallparkScreen({
  est,
  nte,
  setNte,
  media,
  pending,
  onBack,
  onDispatch,
}: {
  est: OwnerBallpark;
  nte: boolean;
  setNte: (v: boolean) => void;
  media: Media[];
  pending: boolean;
  onBack: () => void;
  onDispatch: () => void;
}) {
  const photoN = media.filter((m) => m.kind === "photo").length;
  const videoN = media.filter((m) => m.kind === "video").length;
  const scanN = media.filter((m) => m.kind === "scan").length;
  const linkN = media.filter((m) => m.kind === "link").length;
  const parts: string[] = [];
  if (photoN) parts.push(photoN + " photo" + (photoN > 1 ? "s" : ""));
  if (videoN) parts.push(videoN + " video" + (videoN > 1 ? "s" : ""));
  if (scanN) parts.push("Matterport scan");
  if (linkN) parts.push(linkN + " link" + (linkN > 1 ? "s" : ""));
  const summary = parts.length ? parts.join(" · ") : "no media yet";

  return (
    <Screen
      footer={
        <div className="flex flex-col gap-2">
          <FullBtn onClick={onDispatch} disabled={pending} icon={<IconArrow s={18} />}>
            {pending ? "Dispatching…" : nte ? "Approve & dispatch a crew" : "Dispatch a crew"}
          </FullBtn>
          <BallparkDisclaimer className="bg-transparent px-0.5 py-0 text-[11px]" />
        </div>
      }
    >
      <Header title="Your ballpark" onBack={onBack} />
      <Body>
        <div
          className="rounded-card px-5 pb-[18px] pt-5"
          style={{ background: "var(--navy)", boxShadow: "0 14px 34px rgba(14,42,71,0.28)" }}
        >
          <div className="flex items-center justify-between">
            <Label className="text-white/60">Estimated ballpark</Label>
            <ConfPill level={est.confidence} />
          </div>
          <div className="mt-2 font-mono text-[40px] font-semibold leading-none tracking-[-0.02em] text-white">
            {fmt(est.ballpark)}
          </div>
          <div className="mt-2 font-mono text-[13px] text-[#9fb2c4]">
            Range {fmt(est.low)} – {fmt(est.high)}
          </div>
          <div className="mt-3.5 flex gap-2">
            <div className="relative h-[5px] flex-1 overflow-hidden rounded-[5px] bg-white/[0.12]">
              <div className="absolute inset-y-0 left-[18%] right-[18%] rounded-[5px]" style={{ background: ACCENT }} />
            </div>
          </div>
          <div className="mt-2.5 text-[11.5px] text-[#7d8fa0]">
            Based on {summary} · AI + IICRC + your vendor&apos;s price list
          </div>
        </div>

        <Label className="mt-[22px]">What&apos;s included</Label>
        <OwnerCard className="mt-2.5 px-4 py-1">
          {est.items.map((it, i) => (
            <div
              key={i}
              className="flex items-baseline gap-2.5 py-3"
              style={{ borderBottom: i < est.items.length - 1 ? "1px solid var(--line2)" : "none" }}
            >
              <div className="flex-1">
                <div className="text-[13.5px] leading-snug text-ink">{it.label}</div>
                <div className="mt-0.5 font-mono text-[10.5px] tracking-[0.02em] text-faint">
                  {it.qty > 1
                    ? `${it.qty} × ${fmt(it.unitRaw)}`
                    : it.note || (it.bucket === "ho6" ? "Unit owner (HO6)" : "Master policy")}
                </div>
              </div>
              <div className="font-mono text-[13.5px] font-medium text-navy">{fmt(it.raw)}</div>
            </div>
          ))}
        </OwnerCard>
        <div className="mt-3 flex flex-col gap-[7px] px-1">
          <Row k="Labor · materials · equipment" v={fmt(est.rawSubtotal)} />
          <Row k={`Overhead & profit (${est.opTier})`} v={fmt(est.markup)} />
          <div className="my-1 h-px bg-[var(--line)]" />
          <Row k="Ballpark total" v={fmt(est.ballpark)} bold />
        </div>

        <OwnerCard sel={nte} onClick={() => setNte(!nte)} className="mt-[18px] p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-[46px] flex-shrink-0 rounded-full p-[3px] transition-all"
              style={{
                background: nte ? ACCENT : "rgba(14,42,71,0.14)",
                justifyContent: nte ? "flex-end" : "flex-start",
              }}
            >
              <div className="h-[22px] w-[22px] rounded-full bg-white shadow" />
            </div>
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold text-navy">Approve as not-to-exceed</div>
              <div className="mt-0.5 text-[12px] leading-snug text-faint">
                {nte
                  ? `You won't be billed above ${fmt(est.high)} without your sign-off.`
                  : "Accept as a ballpark — final scope is confirmed on-site."}
              </div>
            </div>
          </div>
        </OwnerCard>
      </Body>
    </Screen>
  );
}

const DISPATCH_STAGES = [
  { k: "Request received", d: "Your report reached dispatch" },
  { k: "Crew dispatched", d: "Team is en route to you" },
  { k: "On-site inspection", d: "Scope confirmed in person" },
  { k: "Contract & start", d: "Signed after inspection — in the CRM" },
];

function DispatchScreen({
  msa,
  vendor,
  nte,
  reduceMotion,
  onHome,
}: {
  msa: boolean;
  vendor: string;
  nte: boolean;
  reduceMotion: boolean;
  onHome: () => void;
}) {
  const [stage, setStage] = useState(reduceMotion ? 2 : 0);
  const [placed, setPlaced] = useState(reduceMotion);
  useEffect(() => {
    if (reduceMotion) return;
    const t0 = setTimeout(() => setPlaced(true), 1300);
    const t1 = setTimeout(() => setStage(1), 2400);
    const t2 = setTimeout(() => setStage(2), 4200);
    return () => [t0, t1, t2].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const eta = 32;

  return (
    <Screen footer={<FullBtn variant="secondary" onClick={onHome}>Back to home</FullBtn>}>
      <Header title="Dispatch" onBack={onHome} right={null} />
      <Body>
        {!placed ? (
          <div className="grid place-items-center px-0 pb-[30px] pt-[50px] text-center">
            <div className="relative mb-[22px] h-[90px] w-[90px]">
              <div
                className="fc-ripple absolute inset-0 rounded-full"
                style={{ background: ACCENT_12, animation: "fcRipple 1.4s ease-out infinite" }}
              />
              <div
                className="absolute inset-[18px] grid place-items-center rounded-full text-white"
                style={{ background: ACCENT, boxShadow: `0 10px 28px ${ACCENT_30}` }}
              >
                <IconPhone s={28} />
              </div>
            </div>
            <div className="text-[19px] font-bold text-navy">Your call is being placed…</div>
            <div className="mt-1.5 text-[13.5px] text-faint">Connecting you with the right crew</div>
          </div>
        ) : (
          <div className="fc-fadeup" style={{ animation: "fcFadeUp .4s ease both" }}>
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="grid h-[26px] w-[26px] place-items-center rounded-full bg-teal text-white">
                <IconCheck s={15} />
              </div>
              <div className="text-[16px] font-bold text-navy">Crew on the way</div>
            </div>

            <OwnerCard className="flex items-center gap-3 p-4">
              <div className="grid h-[50px] w-[50px] flex-shrink-0 place-items-center rounded-[14px] bg-[rgba(14,42,71,0.05)] text-navy">
                <IconTruck s={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-navy">
                  {msa ? vendor : "Summit Restoration Co."}
                </div>
                <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap font-mono text-[11.5px] text-gray">
                  <span className="inline-flex text-[#E8A53A]">
                    <IconStar s={13} />
                  </span>
                  <span>4.9</span>
                  <span className="text-faint">·</span>
                  <span>{msa ? "MSA partner" : "top-rated local"}</span>
                  <span className="text-faint">·</span>
                  <span>ETA&nbsp;{eta}m</span>
                </div>
              </div>
            </OwnerCard>

            <Label className="mt-[22px]">Status</Label>
            <div className="relative mt-3">
              {DISPATCH_STAGES.map((s, i) => {
                const isDone = i < stage;
                const active = i === stage;
                return (
                  <div
                    key={i}
                    className="relative flex gap-3.5"
                    style={{ paddingBottom: i < DISPATCH_STAGES.length - 1 ? 20 : 0 }}
                  >
                    {i < DISPATCH_STAGES.length - 1 ? (
                      <div
                        className="absolute bottom-0 left-3 top-[26px] w-0.5 transition-colors"
                        style={{ background: isDone ? "var(--teal)" : "var(--line)" }}
                      />
                    ) : null}
                    <div
                      className="z-[1] grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-full text-white transition-all"
                      style={{
                        background: isDone ? "var(--teal)" : active ? ACCENT : "var(--card)",
                        border: isDone || active ? "none" : "2px solid var(--line)",
                        boxShadow: active ? `0 0 0 4px ${ACCENT_12}` : "none",
                      }}
                    >
                      {isDone ? <IconCheck s={15} /> : active ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                    </div>
                    <div className="pt-0.5 transition-opacity" style={{ opacity: isDone || active ? 1 : 0.5 }}>
                      <div
                        className="text-[14.5px] text-navy"
                        style={{ fontWeight: active ? 700 : 600 }}
                      >
                        {s.k}
                        {active && i === 2 ? ` · ${eta}m` : ""}
                      </div>
                      <div className="mt-0.5 text-[12px] text-faint">{s.d}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-[22px] flex gap-2.5 rounded-[13px] border border-line bg-[var(--hover)] px-3.5 py-3">
              <div className="mt-px flex-shrink-0 text-navy">
                <IconDoc s={17} />
              </div>
              <div className="text-[12.5px] leading-relaxed text-gray">
                <b className="text-navy">No contract yet.</b> You&apos;ll sign only after the on-site
                inspection confirms scope.
                {nte ? (
                  <span>
                    {" "}
                    Your <b className="text-navy">not-to-exceed</b> approval is attached to this claim.
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Body>
    </Screen>
  );
}

/* ----------------------------------------------------------------- root */

type Step = "home" | "role" | "intake" | "thinking" | "ballpark" | "dispatch";

export function OwnerApp({
  tenant,
  vendor,
  msa,
  causes,
  areas,
}: {
  tenant: string;
  vendor: string;
  msa: boolean;
  causes: Cause[];
  areas: Area[];
}) {
  const [step, setStep] = useState<Step>("home");
  const [role, setRole] = useState<OwnerRole | null>(null);
  const [cause, setCause] = useState<CauseOfLoss | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [note, setNote] = useState("");
  const [nte, setNte] = useState(false);
  const [est, setEst] = useState<OwnerBallpark | null>(null);
  const [thinkingDone, setThinkingDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [generating, startGenerate] = useTransition();
  const [dispatching, startDispatch] = useTransition();

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Advance to the ballpark once the estimate is ready AND the thinking
  // animation has finished — whichever lands last.
  useEffect(() => {
    if (step === "thinking" && est && thinkingDone) setStep("ballpark");
  }, [step, est, thinkingDone]);

  const reset = () => {
    setRole(null);
    setCause(null);
    setSelectedAreas([]);
    setMedia([]);
    setNote("");
    setNte(false);
    setEst(null);
    setThinkingDone(false);
    setStep("home");
  };

  const toggleArea = (id: string) =>
    setSelectedAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const submitIntake = () => {
    if (!cause) return;
    const evidenceWeight = media.reduce(
      (s, m) => s + (m.kind === "scan" ? 5 : m.kind === "video" ? 2 : 1),
      0,
    );
    setEst(null);
    setThinkingDone(false);
    setStep("thinking");
    startGenerate(async () => {
      const ballpark = await createOwnerClaimAction({
        role: role ?? "unit_owner",
        cause,
        areas: selectedAreas,
        note,
        evidenceWeight,
      });
      setEst(ballpark);
    });
  };

  const dispatch = () => {
    if (!est) return;
    startDispatch(async () => {
      await dispatchOwnerClaimAction({ claimId: est.claimId, nte });
      setStep("dispatch");
    });
  };

  let screen: ReactNode = null;
  if (step === "home")
    screen = <HomeScreen msa={msa} tenant={tenant} vendor={vendor} onReport={() => setStep("role")} />;
  else if (step === "role")
    screen = <RoleScreen role={role} setRole={setRole} onBack={() => setStep("home")} onNext={() => setStep("intake")} />;
  else if (step === "intake")
    screen = (
      <IntakeScreen
        causes={causes}
        areas={areas}
        cause={cause}
        setCause={setCause}
        selectedAreas={selectedAreas}
        toggleArea={toggleArea}
        media={media}
        addMedia={(items) => setMedia((m) => [...m, ...items])}
        rmMedia={(id) => setMedia((m) => m.filter((x) => x.id !== id))}
        note={note}
        setNote={setNote}
        onBack={() => setStep("role")}
        onSubmit={submitIntake}
      />
    );
  else if (step === "thinking")
    screen = <ThinkingScreen reduceMotion={reduceMotion} onDone={() => setThinkingDone(true)} />;
  else if (step === "ballpark" && est)
    screen = (
      <BallparkScreen
        est={est}
        nte={nte}
        setNte={setNte}
        media={media}
        pending={dispatching}
        onBack={() => setStep("intake")}
        onDispatch={dispatch}
      />
    );
  else if (step === "dispatch")
    screen = (
      <DispatchScreen msa={msa} vendor={vendor} nte={nte} reduceMotion={reduceMotion} onHome={reset} />
    );

  return (
    <div
      key={step}
      className="fc-screen"
      style={{ animation: reduceMotion ? "none" : "fcScreenIn .42s cubic-bezier(.22,.8,.3,1)" }}
    >
      {screen}
    </div>
  );
}
