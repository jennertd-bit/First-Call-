// web/platform.jsx — FirstCall hub, tweakable (white-label brand + copy)
const { useState: phS } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8703A",
  "brand": "FirstCall",
  "tagline": "One backend · three branded surfaces",
  "headline": "From damage to dispatch, on the",
  "emphasis": "first call",
  "lead": "A white-label ERP + CRM for disaster restoration. An owner taps once to report damage and get an AI ballpark; the restoration company runs the whole job and splits coverage; pricing gets smarter with every signed job.",
  "showChips": true
}/*EDITMODE-END*/;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

const CARDS = [
  { letter: 'A', color: 'var(--accent)', glow: 'var(--accent-40)', label: 'Mobile · PWA', title: 'Owner App',
    href: 'FirstCall%20Owner%20App.html', openColor: 'var(--accent)',
    desc: 'Report damage, get an instant AI ballpark with a not-to-exceed option, and dispatch a crew — used one-handed, mid-emergency.',
    viz: <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-50)" strokeWidth="0.7"><rect x="6" y="2" width="12" height="20" rx="3" /><line x1="9" y1="19" x2="15" y2="19" /></svg> },
  { letter: 'B', color: '#1FA8A0', glow: 'rgba(31,168,160,0.4)', label: 'Responsive web', title: 'PM / HOA Portal',
    href: 'FirstCall%20PM%20Portal.html', openColor: '#1FA8A0',
    desc: 'Upload the master policy once; coverage auto-splits into Master vs HO6. A live unit map shows verification status per unit.',
    viz: <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(31,168,160,0.5)" strokeWidth="0.7"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="9" x2="9" y2="20" /></svg> },
  { letter: 'C', color: '#3a567a', glow: 'rgba(58,86,122,0.5)', label: 'Desktop web', title: 'Restoration CRM',
    href: 'FirstCall%20Restoration%20CRM.html', openColor: '#9fb2c4',
    desc: "The paying customer's command center: dispatch board, the ⇄ Master/HO6 estimate editor, O&P guardrail, and a forever-learning price engine.",
    viz: <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(159,178,196,0.45)" strokeWidth="0.7"><rect x="2" y="4" width="20" height="14" rx="2" /><line x1="2" y1="18" x2="22" y2="18" /><rect x="6" y="9" width="3" height="5" /><rect x="11" y="7" width="3" height="7" /><rect x="16" y="11" width="3" height="3" /></svg> },
];

function Hub() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const rootVars = {
    '--accent': t.accent,
    '--accent-50': rgba(t.accent, 0.5),
    '--accent-40': rgba(t.accent, 0.4),
    '--accent-30': rgba(t.accent, 0.3),
    '--accent-14': rgba(t.accent, 0.14),
  };
  return (
    <div style={{ ...rootVars, width: '100%' }}>
      <div className="glow" style={{ background: rgba(t.accent, 0.12) }}></div>
      <div className="wrap" style={{ margin: '0 auto' }}>
        <div className="brand">
          <div className="mark" style={{ background: t.accent, boxShadow: `0 0 0 7px ${rgba(t.accent, 0.14)}` }}>{(t.brand || 'F').trim()[0] || 'F'}</div>
          <div>
            <div className="nm">{t.brand}</div>
            <div className="tag">{t.tagline}</div>
          </div>
        </div>

        <h1>{t.headline} <span className="o" style={{ color: t.accent }}>{t.emphasis}</span>.</h1>
        <p className="lead">{t.lead}</p>

        <div className="grid">
          {CARDS.map((c) => (
            <a className="card" key={c.letter} href={c.href}>
              <div className="badge" style={{ background: c.color, boxShadow: `0 4px 14px ${c.glow}` }}>{c.letter}</div>
              <div className="label">{c.label}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="open" style={{ color: c.openColor }}>Open surface →</span>
              <div className="viz">{c.viz}</div>
            </a>
          ))}
        </div>

        {t.showChips && (
          <div className="chips">
            <span className="chip">Multi-tenant · <b style={{ color: t.accent }}>white-label</b></span>
            <span className="chip">Master vs <b>HO6</b> coverage split</span>
            <span className="chip">Pricing that <b>learns</b></span>
          </div>
        )}
        <div className="foot">Concept prototype · “{t.brand}”, branding, and figures are placeholders. Estimates are illustrative ballparks, not quotes.</div>
      </div>

      <TweaksPanel>
        <TweakSection label="White-label brand" />
        <TweakColor label="Accent" value={t.accent}
          options={['#E8703A', '#1FA8A0', '#2A6FDB', '#7A5AE0']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakText label="Workspace name" value={t.brand} onChange={(v) => setTweak('brand', v)} />
        <TweakText label="Tagline" value={t.tagline} onChange={(v) => setTweak('tagline', v)} />
        <TweakSection label="Headline" />
        <TweakText label="Headline" value={t.headline} onChange={(v) => setTweak('headline', v)} />
        <TweakText label="Emphasis (accent)" value={t.emphasis} onChange={(v) => setTweak('emphasis', v)} />
        <TweakText label="Lead paragraph" value={t.lead} onChange={(v) => setTweak('lead', v)} />
        <TweakSection label="Layout" />
        <TweakToggle label="Feature chips" value={t.showChips} onChange={(v) => setTweak('showChips', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Hub />);
