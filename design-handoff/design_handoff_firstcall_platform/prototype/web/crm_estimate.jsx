// crm_estimate.jsx — Surface C · Estimate Editor + AI generation + Master/HO6 ⇄ + O&P guardrail
const { useState: euS, useEffect: euE, useMemo: euM } = React;

function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function confOf(photos) { return photos >= 5 ? 'High' : photos >= 2 ? 'Medium' : 'Low'; }

// Build editor line items from inputs via the shared estimate engine.
function buildItems(cause, areas, photoCount) {
  const est = window.FC.buildEstimate({ cause, areas, photoCount, opTier: '15/15' });
  return est.items.map((it, i) => ({
    id: 'li-' + cause + '-' + i, label: it.label, qty: it.qty, unitRaw: it.unitRaw, raw: it.raw, bucket: it.bucket, note: it.note,
  }));
}

function OPStepper({ label, value, onChange, flagged }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
      borderRadius: 10, border: `1px solid ${flagged ? WT.red : WT.line}`, background: flagged ? 'rgba(181,82,75,0.05)' : WT.card }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: WT.navy }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onChange(Math.max(0, value - 5))} style={stepBtn}>−</button>
        <span style={{ fontFamily: WT.mono, fontSize: 15, fontWeight: 600, color: flagged ? WT.red : WT.navy, minWidth: 36, textAlign: 'center' }}>{value}%</span>
        <button onClick={() => onChange(Math.min(40, value + 5))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
const stepBtn = { width: 28, height: 28, borderRadius: 8, border: `1px solid ${WT.line}`, background: WT.card,
  color: WT.navy, cursor: 'pointer', fontSize: 17, fontWeight: 600, display: 'grid', placeItems: 'center', lineHeight: 1 };

function LineItem({ it, onMove, side }) {
  const [h, setH] = euS(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 11px', borderRadius: 10,
        background: WT.card, border: `1px solid ${h ? WT.line : WT.line2}`, boxShadow: h ? WT.shadowSm : 'none',
        transition: '.14s', animation: 'wSlideIn .26s ease' }}>
      <span style={{ color: WT.faint, cursor: 'grab', fontSize: 14, lineHeight: 1, userSelect: 'none' }}>⠿</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: WT.ink, lineHeight: 1.3 }}>{it.label}</div>
        <div style={{ fontFamily: WT.mono, fontSize: 10, color: WT.faint, marginTop: 1 }}>
          {it.qty > 1 ? `${it.qty} × ${fmt(it.unitRaw)}` : (it.note || 'raw cost')}
        </div>
      </div>
      <span style={{ fontFamily: WT.mono, fontSize: 12.5, fontWeight: 500, color: WT.navy }}>{fmt(it.raw)}</span>
      <button title={side === 'master' ? 'Move to HO6 (owner)' : 'Move to Master (HOA)'} onClick={() => onMove(it.id)}
        style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${WT.line}`,
          background: h ? WT.accent : WT.card, color: h ? '#fff' : WT.accent, cursor: 'pointer',
          display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: WT.mono, fontSize: 13, fontWeight: 600, transition: '.14s' }}>⇄</button>
    </div>
  );
}

function BucketCol({ title, tint, bg, items, total, side, onMove }) {
  return (
    <div style={{ border: `1px solid ${WT.line}`, borderRadius: 13, overflow: 'hidden', background: WT.wash, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: bg, borderBottom: `1px solid ${WT.line2}` }}>
        <span style={{ fontFamily: WT.mono, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', color: tint }}>{title}</span>
        <span style={{ fontFamily: WT.mono, fontSize: 14, fontWeight: 600, color: tint }}>{fmt(total)}</span>
      </div>
      <div style={{ padding: 9, display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minHeight: 80 }}>
        {items.length ? items.map((it) => <LineItem key={it.id} it={it} side={side} onMove={onMove} />)
          : <div style={{ display: 'grid', placeItems: 'center', flex: 1, color: WT.faint, fontSize: 12 }}>No items</div>}
      </div>
    </div>
  );
}

// ── Generation control ──
const GEN_CAUSES = ['water', 'fire', 'mold', 'storm'];
function GeneratePanel({ jobId, unit, cause, setCause, areas, setAreas, photos, setPhotos, generating, onGenerate, generated }) {
  const toggleArea = (id) => setAreas(areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id]);
  return (
    <WPanel title={`Generate estimate · ${jobId} · Unit ${unit}`}
      right={<WBadge c={WT.faint} bg={WT.hover}>AI vision + IICRC + price list</WBadge>}
      style={{ marginBottom: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'end' }}>
        <div>
          <WLabel style={{ marginBottom: 8 }}>Cause of loss</WLabel>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {GEN_CAUSES.map((cid) => {
              const C = window.CAUSE_ICONS[cid]; const on = cause === cid;
              return (
                <button key={cid} onClick={() => setCause(cid)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 9,
                  cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, transition: '.14s',
                  border: `1px solid ${on ? WT.accent : WT.line}`, background: on ? 'rgba(232,112,58,0.1)' : WT.card, color: on ? WT.accent : WT.gray }}>
                  <C s={16} />{cid}
                </button>
              );
            })}
          </div>
          <WLabel style={{ marginBottom: 8 }}>Affected areas</WLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {window.FC.AREAS.map((a) => {
              const on = areas.includes(a.id);
              return (
                <button key={a.id} onClick={() => toggleArea(a.id)} style={{ fontSize: 12.5, fontWeight: 500, padding: '7px 12px', borderRadius: 9, cursor: 'pointer', transition: '.14s',
                  border: `1px solid ${on ? WT.accent : WT.line}`, background: on ? 'rgba(232,112,58,0.1)' : WT.card, color: on ? WT.accent : WT.gray }}>{a.label}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', minWidth: 210 }}>
          <div>
            <WLabel style={{ marginBottom: 8 }}>Photos from report</WLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, border: `1px solid ${WT.line}` }}>
              <button onClick={() => setPhotos(Math.max(0, photos - 1))} style={stepBtn}>−</button>
              <span style={{ fontFamily: WT.mono, fontSize: 13, color: WT.navy }}>{photos} photo{photos === 1 ? '' : 's'} · {confOf(photos)}</span>
              <button onClick={() => setPhotos(Math.min(10, photos + 1))} style={stepBtn}>+</button>
            </div>
          </div>
          <WBtn variant="primary" size="lg" disabled={generating} onClick={onGenerate}
            icon={generating ? <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'wSpin .7s linear infinite' }} /> : <IconSpark s={17} />}>
            {generating ? 'Generating…' : (generated ? 'Regenerate estimate' : 'Generate estimate')}
          </WBtn>
          <div style={{ fontSize: 11, color: WT.faint, lineHeight: 1.4, textAlign: 'center' }}>Drafts line items, buckets them Master/HO6, applies O&amp;P.</div>
        </div>
      </div>
    </WPanel>
  );
}

function EstimatePage({ job }) {
  const initCause = job ? (job.cause || 'Water').toLowerCase() : 'water';
  const jobId = job ? job.id : 'J-2041';
  const unit = job ? job.unit : '18';

  const [cause, setCause] = euS(GEN_CAUSES.includes(initCause) ? initCause : 'water');
  const [areas, setAreas] = euS(['kitchen', 'bedroom', 'ceiling']);
  const [photos, setPhotos] = euS(5);
  const [items, setItems] = euS(() => buildItems(cause, ['kitchen', 'bedroom', 'ceiling'], 5));
  const [generating, setGenerating] = euS(false);
  const [generated, setGenerated] = euS(true);
  const [conf, setConf] = euS('High');
  const [oh, setOh] = euS(15);
  const [profit, setProfit] = euS(15);
  const [override, setOverride] = euS(null);
  const [modal, setModal] = euS(false);

  // when arriving from a job, refresh inputs
  euE(() => { if (job) { const c = (job.cause || 'Water').toLowerCase(); if (GEN_CAUSES.includes(c)) setCause(c); } }, [job && job.id]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setItems(buildItems(cause, areas, photos));
      setConf(confOf(photos)); setOh(15); setProfit(15); setOverride(null);
      setGenerating(false); setGenerated(true);
    }, 1300);
  };

  const move = (id) => setItems((arr) => arr.map((it) => it.id === id ? { ...it, bucket: it.bucket === 'master' ? 'ho6' : 'master' } : it));
  const master = items.filter((i) => i.bucket === 'master');
  const ho6 = items.filter((i) => i.bucket === 'ho6');
  const rawMaster = master.reduce((s, i) => s + i.raw, 0);
  const rawHo6 = ho6.reduce((s, i) => s + i.raw, 0);
  const raw = rawMaster + rawHo6;
  const rate = (oh + profit) / 100;
  const flagged = oh > 20 || profit > 20;
  const total = raw * (1 + rate);
  const tiers = [[10, 10], [15, 15], [20, 20]];
  const setTier = (o, p) => { setOh(o); setProfit(p); setOverride(null); };
  const confC = conf === 'High' ? WT.tealDk : conf === 'Medium' ? WT.amber : WT.red;
  const confBg = conf === 'High' ? 'rgba(31,168,160,0.12)' : conf === 'Medium' ? 'rgba(201,138,43,0.14)' : 'rgba(181,82,75,0.12)';

  return (
    <div style={{ padding: 24, maxWidth: 1320, margin: '0 auto' }}>
      <GeneratePanel jobId={jobId} unit={unit} cause={cause} setCause={setCause} areas={areas} setAreas={setAreas}
        photos={photos} setPhotos={setPhotos} generating={generating} onGenerate={generate} generated={generated} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 18, alignItems: 'start' }}>
        <WPanel title={`Estimate · ${jobId} · Unit ${unit} (${cause[0].toUpperCase() + cause.slice(1)})`}
          right={<WBadge c={confC} bg={confBg}>{conf} confidence</WBadge>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: WT.gray }}>
            <span style={{ color: WT.accent, fontFamily: WT.mono, fontWeight: 600, fontSize: 14 }}>⇄</span>
            Tap the <b style={{ color: WT.accent }}>⇄</b> on any line to move it between the Master policy and the owner's HO6 — the dispute-resolution moment, in one action.
          </div>
          <div style={{ position: 'relative' }}>
            {generating && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(251,250,247,0.72)', borderRadius: 12,
                display: 'grid', placeItems: 'center', backdropFilter: 'blur(1px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: WT.mono, fontSize: 13, color: WT.navy }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${WT.line}`, borderTopColor: WT.accent, display: 'inline-block', animation: 'wSpin .7s linear infinite' }} />
                  Drafting line items…
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <BucketCol title="MASTER (HOA)" tint={WT.navy} bg="rgba(14,42,71,0.05)" items={master} total={rawMaster * (1 + rate)} side="master" onMove={move} />
              <BucketCol title="HO6 (UNIT OWNER)" tint={WT.tealDk} bg="rgba(31,168,160,0.08)" items={ho6} total={rawHo6 * (1 + rate)} side="ho6" onMove={move} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '14px 16px', borderRadius: 12, background: WT.navy, color: '#fff' }}>
            <div>
              <div style={{ fontFamily: WT.mono, fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>BALLPARK TOTAL</div>
              <div style={{ fontFamily: WT.mono, fontSize: 28, fontWeight: 600, marginTop: 2 }}>{fmt(total)}</div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: WT.mono, fontSize: 12, color: '#9fb2c4', lineHeight: 1.7 }}>
              <div>Raw {fmt(raw)}</div>
              <div>O&amp;P {oh}/{profit} · {fmt(total - raw)}</div>
              <div style={{ color: '#fff' }}>Master {fmt(rawMaster * (1 + rate))} · HO6 {fmt(rawHo6 * (1 + rate))}</div>
            </div>
          </div>
        </WPanel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 0 }}>
          <WPanel title="O&P guardrail" right={flagged ? <WBadge c={WT.red} bg="rgba(181,82,75,0.12)">⚠ flagged</WBadge> : <WBadge c={WT.tealDk} bg="rgba(31,168,160,0.12)">within tiers</WBadge>}>
            <WLabel style={{ marginBottom: 9 }}>Standard tiers</WLabel>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {tiers.map(([o, p]) => {
                const on = oh === o && profit === p && !flagged;
                return (
                  <button key={o} onClick={() => setTier(o, p)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                    fontFamily: WT.mono, fontSize: 13, fontWeight: 600, transition: '.14s',
                    border: `1px solid ${on ? WT.accent : WT.line}`, background: on ? 'rgba(232,112,58,0.1)' : WT.card, color: on ? WT.accent : WT.gray }}>
                    {o}/{p}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <OPStepper label="Overhead" value={oh} onChange={(v) => { setOh(v); setOverride(null); }} flagged={oh > 20} />
              <OPStepper label="Profit" value={profit} onChange={(v) => { setProfit(v); setOverride(null); }} flagged={profit > 20} />
            </div>
            {flagged && !override && (
              <div style={{ marginTop: 14, padding: 13, borderRadius: 12, background: 'rgba(181,82,75,0.07)', border: '1px solid rgba(181,82,75,0.3)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: WT.red, display: 'flex', alignItems: 'center', gap: 7 }}>⚠ O&amp;P set to {oh}/{profit}</div>
                <div style={{ fontSize: 12, color: '#8e423c', margin: '6px 0 11px', lineHeight: 1.45 }}>Above standard tiers (max 20/20). Confirm this isn't excessive — overrides are logged and quarantined from the learning baseline.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <WBtn size="sm" variant="danger" onClick={() => setModal(true)} style={{ flex: 1 }}>Admin override</WBtn>
                  <WBtn size="sm" variant="secondary" onClick={() => setTier(20, 20)} style={{ flex: 1 }}>Adjust to 20/20</WBtn>
                </div>
              </div>
            )}
            {flagged && override && (
              <div style={{ marginTop: 14, padding: 13, borderRadius: 12, background: 'rgba(201,138,43,0.08)', border: '1px solid rgba(201,138,43,0.3)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: WT.amber, display: 'flex', alignItems: 'center', gap: 7 }}><IconCheck s={15} /> Override logged</div>
                <div style={{ fontSize: 12, color: '#8a6a22', margin: '6px 0 0', lineHeight: 1.45 }}>
                  Approved by <b>{override.by}</b> — “{override.reason}”. This job is quarantined from the normalized learning baseline.
                </div>
              </div>
            )}
          </WPanel>

          <WPanel title="Learning baseline">
            <div style={{ fontSize: 13, color: WT.gray, lineHeight: 1.5 }}>
              On sign-off, this job is stripped of <b style={{ color: WT.navy }}>O&amp;P, tax & markup</b> down to raw labor + materials + equipment, then normalized by market and written to the shared model.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 13 }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: WT.wash, border: `1px solid ${WT.line2}` }}>
                <div style={{ fontFamily: WT.mono, fontSize: 18, fontWeight: 600, color: WT.navy }}>{fmt(raw)}</div>
                <div style={{ fontSize: 11, color: WT.faint }}>raw → baseline</div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: WT.wash, border: `1px solid ${WT.line2}` }}>
                <div style={{ fontFamily: WT.mono, fontSize: 18, fontWeight: 600, color: flagged ? WT.red : WT.teal }}>{flagged ? 'Excluded' : 'Included'}</div>
                <div style={{ fontSize: 11, color: WT.faint }}>{flagged ? 'outlier quarantine' : 'normalized'}</div>
              </div>
            </div>
          </WPanel>
        </div>
      </div>

      <OverrideModal open={modal} onClose={() => setModal(false)} oh={oh} profit={profit}
        onConfirm={(by, reason) => { setOverride({ by, reason }); setModal(false); }} />
    </div>
  );
}

function OverrideModal({ open, onClose, oh, profit, onConfirm }) {
  const [by, setBy] = euS('');
  const [reason, setReason] = euS('');
  euE(() => { if (open) { setBy(''); setReason(''); } }, [open]);
  return (
    <WModal open={open} onClose={onClose} title="Admin override" sub={`Approving non-standard O&P of ${oh}/${profit}`}>
      <div style={{ padding: '11px 13px', borderRadius: 11, background: 'rgba(181,82,75,0.06)', border: '1px solid rgba(181,82,75,0.25)',
        fontSize: 12.5, color: '#8e423c', lineHeight: 1.45, marginBottom: 16 }}>
        Overrides are recorded against your name and excluded from the learning baseline (kept for analysis only — trauma, travel, high-risk).
      </div>
      <WField label="Admin name"><input value={by} onChange={(e) => setBy(e.target.value)} placeholder="e.g. J. Okafor" style={wInput} /></WField>
      <WField label="Reason (required)" hint="Why is this O&P justified for this job?">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Trauma scene with biohazard remediation and after-hours crew."
          style={{ ...wInput, minHeight: 84, resize: 'none', lineHeight: 1.45 }} />
      </WField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <WBtn variant="secondary" onClick={onClose}>Cancel</WBtn>
        <WBtn variant="danger" icon={<IconCheck s={16} />} disabled={!by.trim() || !reason.trim()} onClick={() => onConfirm(by.trim(), reason.trim())}>Log override</WBtn>
      </div>
    </WModal>
  );
}

window.EstimatePage = EstimatePage;
