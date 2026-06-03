import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "./cn";

/* --------------------------------------------------------------- Button */

type ButtonVariant =
  | "primary"
  | "dark"
  | "teal"
  | "secondary"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Per design handoff: primary = accent orange, dark = navy. */
export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold tracking-[-0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-45";
  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-[7px] text-[13px]",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-[13px] text-[15px]",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--brand-accent)] text-white shadow-[0_2px_8px_rgba(232,112,58,0.25)] hover:bg-[var(--brand-accent-dark)]",
    dark: "bg-[var(--brand-primary)] text-white hover:brightness-110",
    teal: "bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)]",
    secondary:
      "border border-line bg-card text-[var(--brand-primary)] hover:bg-[var(--hover)]",
    ghost: "text-gray hover:bg-[var(--hover)]",
    danger:
      "border border-[rgba(181,82,75,0.4)] bg-card text-red hover:bg-[rgba(181,82,75,0.08)]",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

/* --------------------------------------------------------- Disclaimer */

/** Non-removable ballpark disclaimer — must appear on every estimate surface. */
export function BallparkDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-md bg-[rgba(201,138,43,0.12)] px-3 py-2 text-xs text-amber",
        className,
      )}
      role="note"
    >
      Ballpark only. Scope is confirmed on-site and may change with unforeseen
      damage. This is not a quote.
    </p>
  );
}

/* ----------------------------------------------------------------- Card */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-card p-[18px] shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section panel with a wash header strip + mono title. */
export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-line bg-card shadow-sm",
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between border-b border-line2 bg-wash px-[18px] py-[13px]">
          <MonoLabel>{title}</MonoLabel>
          {right}
        </div>
      ) : null}
      <div className={cn("p-[18px]", bodyClassName)}>{children}</div>
    </div>
  );
}

/** Single KPI tile: big mono number + label + optional sub. */
export function Stat({
  n,
  label,
  sub,
  accent,
}: {
  n: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="flex flex-col gap-0.5 p-4">
      <div
        className="font-mono text-[28px] font-semibold leading-[1.05] tracking-[-0.02em]"
        style={{ color: accent ?? "var(--brand-primary)" }}
      >
        {n}
      </div>
      <div className="mt-1 text-[12.5px] font-medium text-ink">{label}</div>
      {sub ? (
        <div className="font-mono text-[10.5px] tracking-[0.03em] text-faint">
          {sub}
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------- Typography */

export function MonoLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mono-label", className)}>{children}</div>;
}

/* ----------------------------------------------------------------- Form */

const fieldBase =
  "w-full rounded-control border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[rgba(232,112,58,0.15)]";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-[var(--brand-primary)]">
        {label}
      </span>
      {children}
      {hint ? <span className="text-[11.5px] text-faint">{hint}</span> : null}
    </label>
  );
}

/* --------------------------------------------------------------- Badge */

export function Badge({
  children,
  className,
  color,
  bg,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] py-[3px] font-mono text-[11px] font-semibold tracking-[0.04em]",
        className,
      )}
      style={{
        color: color ?? "var(--gray)",
        background: bg ?? "var(--hover)",
      }}
    >
      {children}
    </span>
  );
}

const ho6Badge: Record<string, { label: string; color: string; bg: string }> = {
  verified: {
    label: "HO6 verified",
    color: "var(--teal)",
    bg: "rgba(31,168,160,0.12)",
  },
  pending: {
    label: "HO6 pending",
    color: "var(--amber)",
    bg: "rgba(201,138,43,0.14)",
  },
  none: {
    label: "None on file",
    color: "var(--red)",
    bg: "rgba(181,82,75,0.12)",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = ho6Badge[status];
  if (!s) return <Badge>{status}</Badge>;
  return (
    <Badge color={s.color} bg={s.bg}>
      {s.label}
    </Badge>
  );
}
