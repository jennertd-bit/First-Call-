// crm.jsx — Surface C · Restoration CRM / ERP
const { useState: cuS, useMemo: cuM } = React;

const CRM_NAV = [
  { items: [
    { id: 'dispatch', label: 'Dispatch Board', Icon: IconTruck },
    { id: 'estimates', label: 'Estimates', Icon: IconDoc, badge: 5 },
    { id: 'analytics', label: 'Capture Analytics', Icon: IconBolt },
    { id: 'owners', label: 'Owners & Insurance', Icon: IconUsers },
  ] },
  { group: 'Engine', items: [
    { id: 'pricing', label: 'Pricing & Learning', Icon: IconSpark },
    { id: 'onboarding', label: 'Onboarding', Icon: IconCheck, badge: '50%' },
  ] },
];

function kfmt(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : '$' + n; }

// ── Capture ratio gauge (SVG ring) ──
function Gauge({ value = 87, target = 85 }) {
  const r = 46, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  const tAngle = (target / 100) * 360 - 90;
  const tx = 60 + r * Math.cos(tAngle * Math.PI / 180), ty = 60 + r * Math.sin(tAngle * Math.PI / 180);
  return (
    <WCard pad={16} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(14,42,71,0.08)" strokeWidth="11" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={WT.teal} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .6s ease' }} />
          <circle cx={tx} cy={ty} r="4" fill={WT.accent} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: WT.mono, fontSize: 26, fontWeight: 600, color: WT.navy, lineHeight: 1 }}>{value}%</div>
            <div style={{ fontSize: 10, color: WT.faint, marginTop: 2 }}>capture</div>
          </div>
        </div>
      </div>
      <div>
        <WLabel>Capture ratio</WLabel>
        <div style={{ fontSize: 13, color: WT.ink, marginTop: 6, lineHeight: 1.45 }}>
          <b style={{ color: WT.teal }}>Above target.</b><br />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: WT.gray }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: WT.accent }} /> target ≥ {target}%
          </span>
        </div>
      </div>
    </WCard>
  );
}

// ── Kanban ──
function JobCard({ job, onDragStart, onDragEnd, dragging, onOpen }) {
  const tint = window.DATA.CAUSE_TINT[job.cause] || window.DATA.CAUSE_TINT.Other;
  const confC = job.conf === 'High' ? WT.teal : job.conf === 'Med' ? WT.amber : WT.red;
  const [h, setH] = cuS(false);
  return (
    <div draggable onDragStart={(e) => onDragStart(e, job.id)} onDragEnd={onDragEnd}
      onClick={() => onOpen && onOpen(job)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      title="Open estimate"
      style={{ background: WT.card, borderRadius: 11, border: `1px solid ${h ? WT.accent : WT.line}`, padding: 12, cursor: 'pointer',
        boxShadow: dragging ? '0 12px 30px rgba(14,42,71,0.18)' : (h ? WT.shadow : WT.shadowSm), opacity: dragging ? 0.5 : 1,
        borderLeft: `3px solid ${tint.c}`, transition: 'box-shadow .15s, opacity .15s, border-color .15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: WT.mono, fontSize: 10.5, color: WT.faint }}>{job.id}</span>
        <WBadge c={tint.c} bg={tint.bg} style={{ padding: '2px 7px', fontSize: 10 }}>{job.cause}</WBadge>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: WT.navy, marginTop: 6 }}>Unit {job.unit}</div>
      <div style={{ fontSize: 11.5, color: WT.gray, marginTop: 1 }}>{job.owner}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontFamily: WT.mono, fontSize: 13, fontWeight: 600, color: WT.navy }}>{kfmt(job.value)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: WT.mono, fontSize: 10, color: WT.faint }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: confC }} />{job.conf} · {job.eta}
        </span>
      </div>
      <div style={{ marginTop: 9, paddingTop: 8, borderTop: `1px solid ${WT.line2}`, fontFamily: WT.mono, fontSize: 10.5,
        fontWeight: 600, color: h ? WT.accent : WT.faint, display: 'flex', alignItems: 'center', gap: 5, transition: '.14s' }}>
        <IconDoc s={12} /> Open estimate →
      </div>
    </div>
  );
}

function DispatchPage({ onOpenEstimate }) {
  const [jobs, setJobs] = cuS(window.DATA.JOBS);
  const [drag, setDrag] = cuS(null);
  const [over, setOver] = cuS(null);
  const onDragStart = (e, id) => { setDrag(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDrop = (stage) => { if (drag) setJobs((js) => js.map((j) => j.id === drag ? { ...j, stage } : j)); setDrag(null); setOver(null); };
  const pipeline = window.DATA.PIPELINE;
  const total = jobs.reduce((s, j) => s + j.value, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 14, marginBottom: 18, maxWidth: 1320, marginLeft: 'auto', marginRight: 'auto' }}>
        <Gauge value={87} target={85} />
        <WStat n="41" label="Calls captured" sub="this month" icon={<IconPhone s={18} />} />
        <WStat n={kfmt(total)} label="Pipeline value" accent={WT.accent} sub={jobs.length + ' active jobs'} />
        <WStat n="21,408" label="T&M items active" sub="mapped to IICRC" />
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <WLabel style={{ marginBottom: 11 }}>Live job pipeline · drag to advance a stage · click a card to open its estimate</WLabel>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pipeline.length}, 1fr)`, gap: 12, alignItems: 'start' }}>
          {pipeline.map((col) => {
            const colJobs = jobs.filter((j) => j.stage === col.id);
            const sum = colJobs.reduce((s, j) => s + j.value, 0);
            const isOver = over === col.id;
            return (
              <div key={col.id}
                onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
                onDragLeave={() => setOver((o) => o === col.id ? null : o)}
                onDrop={() => onDrop(col.id)}
                style={{ background: isOver ? 'rgba(232,112,58,0.07)' : 'rgba(14,42,71,0.025)', borderRadius: 13,
                  border: `1px solid ${isOver ? WT.accent : WT.line2}`, padding: 9, minHeight: 200, transition: '.14s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 10px' }}>
                  <span style={{ fontFamily: WT.mono, fontSize: 11, fontWeight: 600, color: WT.navy, letterSpacing: '0.03em' }}>
                    {col.label} <span style={{ color: WT.faint }}>{colJobs.length}</span>
                  </span>
                  <span style={{ fontFamily: WT.mono, fontSize: 10, color: WT.faint }}>{sum ? kfmt(sum) : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {colJobs.map((j) => <JobCard key={j.id} job={j} dragging={drag === j.id} onDragStart={onDragStart} onDragEnd={() => { setDrag(null); setOver(null); }} onOpen={onOpenEstimate} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ──
const ONB_STEPS = [
  { id: 1, title: 'Upload 100 historical emergency jobs', sub: 'market baseline + average job cost', meta: '100 / 100', done: true },
  { id: 2, title: 'Import T&M + unit price list', sub: 'mapped to IICRC categories', meta: '21,408 items', done: true },
  { id: 3, title: 'Verify O&P tiers + MSA specialty pricing', sub: 'defaults per client / condo', meta: '3 / 5', done: false },
  { id: 4, title: 'Connect review sources', sub: 'feeds off-MSA "best local crew" routing', meta: '0 / 1', done: false },
];
function OnboardingPage() {
  const [steps, setSteps] = cuS(ONB_STEPS);
  const doneN = steps.filter((s) => s.done).length;
  const pct = Math.round((doneN / steps.length) * 100);
  const complete = (id) => setSteps((ss) => ss.map((s) => s.id === id ? { ...s, done: true, meta: 'done' } : s));
  return (
    <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
      <WPanel title="Feed the learning engine" right={<WBadge c={WT.accent} bg="rgba(232,112,58,0.12)">{pct}% complete</WBadge>}>
        <div style={{ height: 8, borderRadius: 8, background: 'rgba(14,42,71,0.08)', overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ height: '100%', width: pct + '%', background: WT.accent, borderRadius: 8, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 12,
              background: s.done ? 'rgba(31,168,160,0.06)' : WT.wash, border: `1px solid ${s.done ? 'rgba(31,168,160,0.25)' : WT.line}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center',
                background: s.done ? WT.teal : WT.card, color: s.done ? '#fff' : WT.faint, border: s.done ? 'none' : `1px solid ${WT.line}` }}>
                {s.done ? <IconCheck s={17} /> : <span style={{ fontFamily: WT.mono, fontSize: 12, fontWeight: 600 }}>{s.id}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: WT.navy }}>{s.title}</div>
                <div style={{ fontFamily: WT.mono, fontSize: 10.5, color: WT.faint, marginTop: 1 }}>{s.sub}</div>
              </div>
              {s.done
                ? <WBadge c={WT.tealDk} bg="rgba(31,168,160,0.12)">{s.meta}</WBadge>
                : <WBtn size="sm" variant="primary" onClick={() => complete(s.id)}>Complete</WBtn>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: WT.faint, marginTop: 16, lineHeight: 1.5, display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}><IconSpark s={15} /></span>
          100 historicals + the price list establish this tenant's baseline. Every signed job thereafter — O&P & tax stripped to raw cost — feeds the forever-learning engine across all markets.
        </div>
      </WPanel>
    </div>
  );
}

// ── Lite pages ──
function OwnersPage() {
  const owners = window.DATA.UNITS.slice(0, 14);
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <WPanel title="Owners & insurance" bodyStyle={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 160px 1fr', padding: '11px 18px', borderBottom: `1px solid ${WT.line2}`,
          fontFamily: WT.mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: WT.faint, fontWeight: 600 }}>
          <span>Owner</span><span>Unit</span><span>HO6 status</span><span>Property</span>
        </div>
        {owners.map((u) => {
          const cov = COV[u.ho6];
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 160px 1fr', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${WT.line2}`, fontSize: 13 }}>
              <span style={{ color: WT.ink, fontWeight: 500 }}>{u.owner}</span>
              <span style={{ fontFamily: WT.mono, color: WT.navy }}>{u.num}</span>
              <span><WBadge c={cov.c} bg={cov.bg}>{cov.label}</WBadge></span>
              <span style={{ color: WT.gray }}>Harborview Condominiums</span>
            </div>
          );
        })}
      </WPanel>
    </div>
  );
}

function SimplePage({ icon, title, body }) {
  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <WPanel title={title}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(232,112,58,0.1)', color: WT.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
          <div style={{ fontSize: 13.5, color: WT.gray, lineHeight: 1.55 }}>{body}</div>
        </div>
      </WPanel>
    </div>
  );
}

function CRMApp() {
  const [page, setPage] = cuS('dispatch');
  const [estJob, setEstJob] = cuS(null);
  const openEstimate = (job) => { setEstJob(job); setPage('estimates'); };
  const titles = {
    dispatch: ['Dispatch Board', 'Operations'],
    estimates: ['Estimate Editor', 'Coverage split & O&P'],
    analytics: ['Capture Analytics', 'North-star metric'],
    owners: ['Owners & Insurance', 'Records'],
    pricing: ['Pricing & Learning', 'The engine'],
    onboarding: ['Onboarding', 'Feed the engine'],
  };
  const [t0, t1] = titles[page];
  return (
    <Shell surface="crm" sublabel="Restoration CRM / ERP" tenant="Summit Restoration" nav={CRM_NAV} page={page} onPage={setPage}
      title={t0} sub={t1}
      actions={page === 'dispatch' ? <WBtn size="md" variant="primary" icon={<IconPlus s={16} />}>New job</WBtn> : null}>
      {page === 'dispatch' && <DispatchPage onOpenEstimate={openEstimate} />}
      {page === 'estimates' && <window.EstimatePage job={estJob} />}
      {page === 'onboarding' && <OnboardingPage />}
      {page === 'owners' && <OwnersPage />}
      {page === 'analytics' && <SimplePage icon={<IconBolt s={24} />} title="Capture analytics"
        body={<>Capture ratio is the tenant's north-star metric (target ≥85%). Calls captured, response times, and conversion by cause-of-loss surface here. Currently tracking <b style={{ color: WT.navy }}>87%</b> capture across 41 calls this month.</>} />}
      {page === 'pricing' && <SimplePage icon={<IconSpark s={24} />} title="Pricing & learning"
        body={<>Every signed job is normalized — O&P, tax, and markup stripped to raw labor + materials + equipment — and written to a shared, market-tagged model. Outliers (trauma, travel, high-risk overrides) are quarantined so they never poison normalized regional pricing.</>} />}
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CRMApp />);
