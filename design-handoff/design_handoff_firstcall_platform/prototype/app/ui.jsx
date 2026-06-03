// ui.jsx — FirstCall design system primitives (hi-fi).
// Brand: navy #0E2A47 · accent (var --accent, default orange) · teal #1FA8A0 · paper #F4F3EF
const { useState, useEffect, useRef } = React;

const T = {
  navy: '#0E2A47', ink: '#1B2733', gray: '#6E7A86', faint: '#9AA6B2',
  teal: '#1FA8A0', paper: '#F4F3EF', card: '#FFFFFF', line: 'rgba(14,42,71,0.10)',
  hairline: 'rgba(14,42,71,0.07)',
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  shadow: '0 1px 2px rgba(14,42,71,0.05), 0 10px 30px rgba(14,42,71,0.07)',
  shadowSm: '0 1px 2px rgba(14,42,71,0.06), 0 4px 12px rgba(14,42,71,0.05)',
};
const SAFE_TOP = 54, SAFE_BOT = 30, PAD = 22;

// Monospace eyebrow label
function Label({ children, style }) {
  return <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: T.faint, fontWeight: 500, ...style }}>{children}</div>;
}

function Card({ children, style, onClick, sel }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, borderRadius: 20,
      border: `1px solid ${sel ? 'var(--accent)' : T.line}`,
      boxShadow: sel ? '0 0 0 3px var(--accent-12), ' + T.shadowSm : T.shadowSm,
      transition: 'border-color .18s, box-shadow .18s, transform .12s',
      cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>
  );
}

// Primary / secondary / ghost buttons
function Button({ children, onClick, variant = 'primary', icon, disabled, style }) {
  const base = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    fontFamily: T.sans, fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.01em',
    padding: '16px 18px', borderRadius: 15, border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'transform .12s, box-shadow .2s, opacity .2s',
    WebkitTapHighlightColor: 'transparent', opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', boxShadow: '0 6px 18px var(--accent-30)' },
    dark:    { background: T.navy, color: '#fff', boxShadow: '0 6px 16px rgba(14,42,71,0.22)' },
    secondary:{ background: T.card, color: T.navy, borderColor: T.line, boxShadow: T.shadowSm },
    ghost:   { background: 'transparent', color: T.gray },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}{icon}
    </button>
  );
}

// App header inside the device. Shows back chevron + title, or brand on home.
function Header({ title, onBack, right, brand, tenant, accent }) {
  return (
    <div style={{ paddingTop: SAFE_TOP, paddingLeft: PAD, paddingRight: PAD, paddingBottom: 12,
      display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 5 }}>
      {brand ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent)',
            display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.mono, fontWeight: 600,
            fontSize: 18, boxShadow: '0 4px 12px var(--accent-30)' }}>{(tenant || 'F')[0]}</div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: '0.04em', color: T.navy, fontWeight: 600 }}>{tenant || 'FirstCall'}</div>
            <div style={{ fontSize: 11.5, color: T.faint, marginTop: 1 }}>Restoration response</div>
          </div>
        </div>
      ) : (
        <>
          <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 12,
            border: `1px solid ${T.line}`, background: T.card, color: T.navy, display: 'grid',
            placeItems: 'center', cursor: 'pointer', boxShadow: T.shadowSm, flexShrink: 0 }}>
            <IconBack s={20} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: T.navy, letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ width: 38, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
        </>
      )}
    </div>
  );
}

// Step progress (4 segments) for the intake stepper
function Steps({ n, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: `0 ${PAD}px 4px` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4,
          background: i < n ? 'var(--accent)' : 'rgba(14,42,71,0.12)', transition: 'background .3s' }} />
      ))}
    </div>
  );
}

// Scrollable body + sticky footer scaffold for a screen
function Screen({ children, footer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
      {footer && (
        <div style={{ padding: `12px ${PAD}px ${SAFE_BOT}px`,
          background: 'linear-gradient(to top, ' + T.paper + ' 72%, transparent)',
          position: 'relative', zIndex: 4 }}>{footer}</div>
      )}
    </div>
  );
}

const Body = ({ children, style }) => (
  <div style={{ padding: `4px ${PAD}px 20px`, ...style }}>{children}</div>
);

// Disclaimer line — non-removable per spec, shown on every estimate surface
function Disclaimer({ style }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', ...style }}>
      <div style={{ marginTop: 1, color: T.faint, flexShrink: 0 }}><IconShield s={14} /></div>
      <div style={{ fontFamily: T.mono, fontSize: 10.5, lineHeight: 1.5, color: T.faint, letterSpacing: '0.01em' }}>
        Ballpark only — not a quote. Scope is confirmed on-site and may change with unforeseen damage.
      </div>
    </div>
  );
}

Object.assign(window, { T, SAFE_TOP, SAFE_BOT, PAD, Label, Card, Button, Header, Steps, Screen, Body, Disclaimer });
