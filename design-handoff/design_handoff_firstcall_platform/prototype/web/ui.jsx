// web/ui.jsx — FirstCall desktop platform shell + primitives (Surfaces B & C)
// Brand: navy #0E2A47 · accent #E8703A · teal #1FA8A0 · paper #F4F3EF · IBM Plex
const { useState: wuS, useEffect: wuE, useRef: wuR } = React;

const WT = {
  navy: '#0E2A47', ink: '#1B2733', gray: '#6E7A86', faint: '#9AA6B2',
  teal: '#1FA8A0', tealDk: '#157E78', accent: '#E8703A', accentDk: '#CC5A28',
  amber: '#C98A2B', red: '#B5524B',
  paper: '#F4F3EF', card: '#FFFFFF', wash: '#FBFAF7',
  line: 'rgba(14,42,71,0.10)', line2: 'rgba(14,42,71,0.06)', hover: 'rgba(14,42,71,0.04)',
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  shadow: '0 1px 2px rgba(14,42,71,0.05), 0 10px 30px rgba(14,42,71,0.07)',
  shadowSm: '0 1px 2px rgba(14,42,71,0.05), 0 3px 10px rgba(14,42,71,0.05)',
};

const SURFACES = [
  { id: 'owner', label: 'Owner App', href: 'FirstCall%20Owner%20App.html' },
  { id: 'pm', label: 'PM Portal', href: 'FirstCall%20PM%20Portal.html' },
  { id: 'crm', label: 'Restoration CRM', href: 'FirstCall%20Restoration%20CRM.html' },
];

// statusy color helpers
const COV = {
  verified: { c: WT.teal, bg: 'rgba(31,168,160,0.12)', label: 'HO6 verified' },
  pending:  { c: WT.amber, bg: 'rgba(201,138,43,0.14)', label: 'HO6 pending' },
  none:     { c: WT.red, bg: 'rgba(181,82,75,0.12)', label: 'None on file' },
};

function WLabel({ children, style }) {
  return <div style={{ fontFamily: WT.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: WT.faint, fontWeight: 500, ...style }}>{children}</div>;
}

function WCard({ children, style, onClick, sel, pad = 18, hover }) {
  const [h, setH] = wuS(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: WT.card, borderRadius: 16, border: `1px solid ${sel ? WT.accent : WT.line}`,
        boxShadow: sel ? '0 0 0 3px rgba(232,112,58,0.12), ' + WT.shadowSm : (h ? WT.shadow : WT.shadowSm),
        padding: pad, transition: 'box-shadow .18s, border-color .18s, transform .12s',
        cursor: onClick ? 'pointer' : 'default', transform: h ? 'translateY(-1px)' : 'none', ...style }}>
      {children}
    </div>
  );
}

function WBtn({ children, onClick, variant = 'primary', icon, size = 'md', disabled, style }) {
  const [h, setH] = wuS(false);
  const sizes = { sm: { p: '7px 12px', f: 13 }, md: { p: '10px 16px', f: 14 }, lg: { p: '13px 20px', f: 15 } };
  const s = sizes[size];
  const variants = {
    primary: { background: h ? WT.accentDk : WT.accent, color: '#fff', border: '1px solid transparent', boxShadow: '0 2px 8px rgba(232,112,58,0.25)' },
    dark: { background: h ? '#0A2038' : WT.navy, color: '#fff', border: '1px solid transparent' },
    teal: { background: h ? WT.tealDk : WT.teal, color: '#fff', border: '1px solid transparent' },
    secondary: { background: h ? WT.hover : WT.card, color: WT.navy, border: `1px solid ${WT.line}` },
    ghost: { background: h ? WT.hover : 'transparent', color: WT.gray, border: '1px solid transparent' },
    danger: { background: h ? 'rgba(181,82,75,0.08)' : WT.card, color: WT.red, border: `1px solid rgba(181,82,75,0.4)` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: WT.sans,
        fontSize: s.f, fontWeight: 600, letterSpacing: '-0.01em', padding: s.p, borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, transition: '.15s',
        whiteSpace: 'nowrap', ...variants[variant], ...style }}>
      {icon}{children}
    </button>
  );
}

function WBadge({ children, c = WT.gray, bg = WT.hover, style }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: WT.mono, fontSize: 11,
    fontWeight: 600, letterSpacing: '0.04em', color: c, background: bg, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', ...style }}>{children}</span>;
}

function WStat({ n, label, sub, accent, icon }) {
  return (
    <WCard pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: WT.mono, fontSize: 28, fontWeight: 600, color: accent || WT.navy, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{n}</div>
        {icon && <div style={{ color: WT.faint }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 12.5, color: WT.ink, fontWeight: 500, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: WT.mono, fontSize: 10.5, color: WT.faint, letterSpacing: '0.03em' }}>{sub}</div>}
    </WCard>
  );
}

function WPanel({ title, right, children, style, bodyStyle }) {
  return (
    <div style={{ background: WT.card, borderRadius: 16, border: `1px solid ${WT.line}`, boxShadow: WT.shadowSm, overflow: 'hidden', ...style }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px',
          borderBottom: `1px solid ${WT.line2}`, background: WT.wash }}>
          <WLabel style={{ fontSize: 11.5 }}>{title}</WLabel>
          {right}
        </div>
      )}
      <div style={{ padding: 18, ...bodyStyle }}>{children}</div>
    </div>
  );
}

function WModal({ open, onClose, title, sub, children, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(11,28,46,0.45)',
      backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 24, animation: 'wFade .2s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: '100%', background: WT.card, borderRadius: 18,
        boxShadow: '0 30px 80px rgba(0,0,0,0.35)', animation: 'wPop .22s cubic-bezier(.2,.8,.3,1)', maxHeight: '88vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 22px 14px' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: WT.navy, letterSpacing: '-0.01em' }}>{title}</div>
            {sub && <div style={{ fontSize: 13, color: WT.gray, marginTop: 3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${WT.line}`,
            background: WT.card, color: WT.gray, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><IconClose s={16} /></button>
        </div>
        <div style={{ padding: '0 22px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

function WField({ label, children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: WT.navy, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: WT.faint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}
const wInput = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${WT.line}`,
  background: WT.card, fontFamily: WT.sans, fontSize: 14, color: WT.ink, outline: 'none', boxSizing: 'border-box' };

function WToggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 42, height: 25, borderRadius: 99, padding: 3, cursor: 'pointer',
      background: on ? WT.teal : 'rgba(14,42,71,0.14)', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: '.18s' }}>
      <div style={{ width: 19, height: 19, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ── Sidebar nav item ──
function NavItem({ item, active, onClick }) {
  const [h, setH] = wuS(false);
  const on = active;
  const Icon = item.Icon;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
        position: 'relative', color: on ? WT.accent : (h ? WT.navy : WT.gray),
        background: on ? 'rgba(232,112,58,0.10)' : (h ? WT.hover : 'transparent'),
        fontWeight: on ? 600 : 500, fontSize: 13.5, transition: '.14s' }}>
      {Icon && <Icon s={18} />}
      <span>{item.label}</span>
      {item.badge != null && (
        <span style={{ marginLeft: 'auto', fontFamily: WT.mono, fontSize: 10.5, fontWeight: 600,
          color: on ? WT.accent : WT.faint, background: on ? 'rgba(232,112,58,0.14)' : WT.hover, padding: '1px 7px', borderRadius: 99 }}>{item.badge}</span>
      )}
    </div>
  );
}

function Sidebar({ surface, sublabel, nav, page, onPage, tenant }) {
  return (
    <div style={{ width: 248, flexShrink: 0, background: WT.card, borderRight: `1px solid ${WT.line}`,
      display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* brand */}
      <div style={{ padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: WT.accent, display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: WT.mono, fontWeight: 600, fontSize: 18, boxShadow: '0 4px 12px rgba(232,112,58,0.3)' }}>F</div>
        <div>
          <div style={{ fontFamily: WT.mono, fontSize: 14, fontWeight: 600, color: WT.navy, letterSpacing: '0.02em' }}>FirstCall</div>
          <div style={{ fontSize: 11, color: WT.faint, marginTop: 1 }}>{sublabel}</div>
        </div>
      </div>
      {/* nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
        {nav.map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            {grp.group && <WLabel style={{ fontSize: 10, margin: '4px 11px 8px', color: WT.faint }}>{grp.group}</WLabel>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grp.items.map((it) => <NavItem key={it.id} item={it} active={page === it.id} onClick={() => onPage(it.id)} />)}
            </div>
          </div>
        ))}
      </div>
      {/* tenant */}
      <div style={{ padding: 12, borderTop: `1px solid ${WT.line2}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 11, background: WT.wash, border: `1px solid ${WT.line2}` }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: WT.navy, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: WT.mono, fontSize: 13, fontWeight: 600 }}>{tenant[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: WT.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant}</div>
            <div style={{ fontSize: 10.5, color: WT.faint }}>Tenant workspace</div>
          </div>
          <div style={{ color: WT.faint }}><IconUsers s={15} /></div>
        </div>
      </div>
    </div>
  );
}

function SurfaceSwitcher({ current }) {
  return (
    <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 11, background: WT.hover, border: `1px solid ${WT.line2}` }}>
      {SURFACES.map((s) => {
        const on = s.id === current;
        return on ? (
          <span key={s.id} style={{ fontFamily: WT.mono, fontSize: 11.5, fontWeight: 600, color: WT.navy, background: WT.card,
            padding: '6px 12px', borderRadius: 8, boxShadow: WT.shadowSm, letterSpacing: '0.02em' }}>{s.label}</span>
        ) : (
          <a key={s.id} href={s.href} style={{ fontFamily: WT.mono, fontSize: 11.5, fontWeight: 500, color: WT.gray,
            padding: '6px 12px', borderRadius: 8, textDecoration: 'none', letterSpacing: '0.02em' }}>{s.label}</a>
        );
      })}
    </div>
  );
}

function TopBar({ surface, title, sub, actions }) {
  return (
    <div style={{ height: 64, flexShrink: 0, borderBottom: `1px solid ${WT.line}`, background: WT.card,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ flexShrink: 0, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: WT.navy, letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>{title}</div>
        {sub && <div style={{ fontFamily: WT.mono, fontSize: 11, color: WT.faint, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {actions}
        <SurfaceSwitcher current={surface} />
      </div>
    </div>
  );
}

function Shell({ surface, sublabel, nav, page, onPage, tenant = 'Summit Restoration', title, sub, actions, children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: WT.paper, color: WT.ink, fontFamily: WT.sans, overflow: 'hidden' }}>
      <Sidebar surface={surface} sublabel={sublabel} nav={nav} page={page} onPage={onPage} tenant={tenant} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar surface={surface} title={title} sub={sub} actions={actions} />
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  WT, SURFACES, COV, WLabel, WCard, WBtn, WBadge, WStat, WPanel, WModal, WField, wInput, WToggle,
  Sidebar, SurfaceSwitcher, TopBar, Shell,
});
