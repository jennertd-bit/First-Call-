// pm.jsx — Surface B · PM / HOA Portal
const { useState: puS, useMemo: puM } = React;
const { WT, COV, WLabel, WCard, WBtn, WBadge, WStat, WPanel, WModal, WField, wInput, WToggle, Shell } = window;

const PM_NAV = [
{ items: [
  { id: 'coverage', label: 'Coverage Split', Icon: IconShield },
  { id: 'units', label: 'Units & Owners', Icon: IconUsers, badge: '100' },
  { id: 'claims', label: 'Active Claims', Icon: IconBolt, badge: 3 }]
},
{ group: 'Settings', items: [
  { id: 'vendors', label: 'Vendors / MSA', Icon: IconTruck }]
}];


function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
      background: WT.navy, color: '#fff', padding: '12px 20px', borderRadius: 12, boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 500, animation: 'wPop .25s ease' }}>
      <span style={{ color: WT.teal, display: 'inline-flex' }}><IconCheck s={17} /></span>{msg}
    </div>);

}

// ── Coverage split editor (Master | HO6) ──
function CoverageEditor({ coverage, setCoverage, editable = true }) {
  const move = (bucket, idx) => {
    setCoverage((c) => {
      const from = bucket,to = bucket === 'master' ? 'ho6' : 'master';
      const item = c[from][idx];
      return { ...c, [from]: c[from].filter((_, i) => i !== idx), [to]: [...c[to], item] };
    });
  };
  const Col = ({ bucket, title, c }) =>
  <div style={{ border: `1px solid ${WT.line}`, borderRadius: 13, overflow: 'hidden', background: WT.card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px',
      background: bucket === 'master' ? 'rgba(14,42,71,0.05)' : 'rgba(31,168,160,0.08)', borderBottom: `1px solid ${WT.line2}` }}>
        <div style={{ fontFamily: WT.mono, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', color: bucket === 'master' ? WT.navy : WT.tealDk }}>
          {title}
        </div>
        <WBadge c={bucket === 'master' ? WT.navy : WT.tealDk} bg={bucket === 'master' ? 'rgba(14,42,71,0.06)' : 'rgba(31,168,160,0.12)'}>{c.length}</WBadge>
      </div>
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
        {coverage[bucket].map((item, i) =>
      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9,
        background: WT.wash, border: `1px solid ${WT.line2}`, fontSize: 12.5, color: WT.ink, animation: 'wSlideIn .25s ease' }}>
            <span style={{ flex: 1 }}>{item}</span>
            {editable &&
        <button title="Move to other policy" onClick={() => move(bucket, i)}
        style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${WT.line}`, background: WT.card,
          color: WT.accent, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
          fontFamily: WT.mono, fontSize: 13, fontWeight: 600 }}>⇄</button>
        }
          </div>
      )}
      </div>
    </div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Col bucket="master" title="MASTER (HOA)" c={coverage.master} />
      <Col bucket="ho6" title="HO6 (UNIT OWNER)" c={coverage.ho6} />
    </div>);

}

// ── Unit map ──
function UnitMap({ units, selId, onSelect, filter }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 7 }}>
        {units.map((u) => {
          const cov = COV[u.ho6];
          const on = selId === u.id;
          const dim = filter !== 'all' && u.ho6 !== filter;
          return (
            <button key={u.id} onClick={() => onSelect(u.id)} title={`Unit ${u.num} · ${cov.label}`}
            style={{ aspectRatio: '1', borderRadius: 9, cursor: 'pointer', position: 'relative',
              border: on ? `2px solid ${WT.accent}` : `1px solid ${WT.line}`,
              background: cov.bg, color: cov.c, opacity: dim ? 0.28 : 1,
              boxShadow: on ? '0 0 0 3px rgba(232,112,58,0.18)' : 'none',
              display: 'grid', placeItems: 'center', fontFamily: WT.mono, fontSize: 11.5, fontWeight: 600, transition: '.14s' }}>
              {u.num}
              {u.activeClaim && <span style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: '50%', background: WT.accent }} />}
            </button>);

        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {Object.entries(COV).map(([k, v]) =>
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: WT.gray }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: v.bg, border: `1px solid ${v.c}` }} />{v.label}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: WT.gray }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: WT.accent }} />active claim
        </div>
      </div>
    </div>);

}

function UnitDetail({ unit, coverage, onVerify, onInvite }) {
  if (!unit) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '40px 20px', color: WT.faint }}>
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IconPin s={30} /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: WT.gray }}>Select a unit</div>
          <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: '26ch' }}>Tap any unit in the map to see its coverage split and owner.</div>
        </div>
      </div>);

  }
  const cov = COV[unit.ho6];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: WT.navy, letterSpacing: '-0.02em' }}>Unit {unit.num}</div>
          <div style={{ fontSize: 13, color: WT.gray, marginTop: 2, whiteSpace: 'nowrap' }}>{unit.owner} · Floor {unit.floor}</div>
        </div>
        <WBadge c={cov.c} bg={cov.bg}>{cov.label}</WBadge>
      </div>
      {unit.ho6 !== 'verified' &&
      <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 11, background: 'rgba(181,82,75,0.07)',
        border: '1px solid rgba(181,82,75,0.25)', fontSize: 12.5, color: '#8e423c', lineHeight: 1.45 }}>
          <b>Coverage gate.</b> A claim on this unit will prompt “verify coverage before proceeding.”
        </div>
      }
      <WLabel style={{ marginTop: 18, marginBottom: 9 }}>This unit's split</WLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <SplitRow label="Master (HOA) covers" items={coverage.master.length} tint={WT.navy} bg="rgba(14,42,71,0.05)" />
        <SplitRow label="HO6 (owner) covers" items={coverage.ho6.length} tint={WT.tealDk} bg="rgba(31,168,160,0.10)" />
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
        {unit.ho6 !== 'verified' ?
        <WBtn variant="teal" size="md" icon={<IconCheck s={16} />} onClick={() => onVerify(unit.id)} style={{ flex: 1 }}>Verify HO6</WBtn> :
        <WBtn variant="secondary" size="md" icon={<IconCheck s={16} />} style={{ flex: 1 }} disabled>HO6 verified</WBtn>}
        <WBtn variant="secondary" size="md" icon={<IconPlus s={16} />} onClick={() => onInvite(unit)} style={{ flex: 1 }}>Invite owner</WBtn>
      </div>
    </div>);

}
function SplitRow({ label, items, tint, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', borderRadius: 10, background: bg }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: tint }}>{label}</span>
      <span style={{ fontFamily: WT.mono, fontSize: 12, color: tint }}>{items} responsibilities</span>
    </div>);

}

// ── Coverage page ──
function CoveragePage({ units, setUnits, coverage, setCoverage, selId, setSelId, openInvite, toast }) {
  const [filter, setFilter] = puS('all');
  const [parsing, setParsing] = puS(false);
  const stats = puM(() => ({
    enrolled: 100,
    verified: units.filter((u) => u.ho6 === 'verified').length + 60,
    pending: units.filter((u) => u.ho6 === 'pending').length,
    none: units.filter((u) => u.ho6 === 'none').length
  }), [units]);
  const sel = units.find((u) => u.id === selId);
  const verify = (id) => {setUnits((us) => us.map((u) => u.id === id ? { ...u, ho6: 'verified' } : u));toast('HO6 coverage verified for unit ' + units.find((u) => u.id === id).num);};
  const reparse = () => {setParsing(true);setTimeout(() => {setParsing(false);toast('Master policy re-parsed · responsibilities updated');}, 1600);};

  return (
    <div style={{ padding: 24, maxWidth: 1320, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        <WStat n="100" label="Units enrolled" sub="Harborview Condominiums" />
        <WStat n={stats.verified} label="HO6 verified" accent={WT.teal} sub={Math.round(stats.verified) + '% of building'} />
        <WStat n={stats.pending} label="HO6 pending" accent={WT.amber} sub="awaiting owner upload" />
        <WStat n={stats.none} label="None on file" accent={WT.red} sub="coverage gate active" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18, alignItems: 'start' }}>
        <WPanel title="Unit coverage map" right={
        <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'verified', 'pending', 'none'].map((f) =>
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: WT.mono, fontSize: 10.5, fontWeight: 600,
            padding: '4px 9px', borderRadius: 7, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
            border: `1px solid ${filter === f ? WT.accent : WT.line}`, background: filter === f ? 'rgba(232,112,58,0.1)' : WT.card,
            color: filter === f ? WT.accent : WT.gray }}>{f}</button>
          )}
          </div>
        }>
          <UnitMap units={units} selId={selId} onSelect={setSelId} filter={filter} />
        </WPanel>
        <WCard pad={20} style={{ position: 'sticky', top: 0 }}>
          <UnitDetail unit={sel} coverage={coverage} onVerify={verify} onInvite={openInvite} />
        </WCard>
      </div>

      <WPanel title="Master policy — responsibility split" right={
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WBadge c={WT.tealDk} bg="rgba(31,168,160,0.12)"><IconCheck s={12} /> parsed</WBadge>
          <WBtn size="sm" variant="secondary" icon={<IconDoc s={14} />} onClick={reparse} disabled={parsing}>{parsing ? 'Parsing…' : 'Re-parse PDF'}</WBtn>
        </div>
      }>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 11,
          background: WT.wash, border: `1px dashed ${WT.line}`, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(14,42,71,0.06)', color: WT.navy, display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconDoc s={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: WT.navy }}>Harborview-master-policy.pdf</div>
            <div style={{ fontFamily: WT.mono, fontSize: 11, color: WT.faint }}>{parsing ? 'extracting responsibilities…' : 'parsed · 11 responsibilities mapped · edit below'}</div>
          </div>
          {parsing && <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${WT.line}`, borderTopColor: WT.accent, animation: 'wSpin .7s linear infinite' }} />}
        </div>
        <CoverageEditor coverage={coverage} setCoverage={setCoverage} />
        <div style={{ fontSize: 12, color: WT.faint, marginTop: 13, lineHeight: 1.45, display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}><IconShield s={14} /></span>
          Parsed defaults shown. Use <b style={{ color: WT.accent, fontFamily: WT.mono }}>⇄</b> to move a responsibility between the master policy and the unit owner's HO6. This is the source of truth for every claim in the building.
        </div>
      </WPanel>
    </div>);

}

// ── Units & Owners table ──
function UnitsPage({ units, openInvite, toast }) {
  const [q, setQ] = puS('');
  const rows = units.filter((u) => (u.num + u.owner).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <WPanel title={`${units.length} units shown · 100 enrolled`} right={
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search unit or owner…"
      style={{ ...wInput, width: 220, padding: '7px 11px', fontSize: 12.5 }} />
      } bodyStyle={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 160px 1fr', padding: '11px 18px', borderBottom: `1px solid ${WT.line2}`,
          fontFamily: WT.mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: WT.faint, fontWeight: 600 }}>
          <span>Unit</span><span>Owner</span><span>Floor</span><span>HO6 status</span><span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        <div style={{ maxHeight: '64vh', overflowY: 'auto' }}>
          {rows.map((u) => {
            const cov = COV[u.ho6];
            return (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 160px 1fr', alignItems: 'center',
                padding: '11px 18px', borderBottom: `1px solid ${WT.line2}`, fontSize: 13 }}>
                <span style={{ fontFamily: WT.mono, fontWeight: 600, color: WT.navy }}>{u.num}</span>
                <span style={{ color: WT.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.owner}{u.activeClaim && <WBadge c={WT.accent} bg="rgba(232,112,58,0.12)">claim open</WBadge>}
                </span>
                <span style={{ color: WT.gray, fontFamily: WT.mono, fontSize: 12 }}>{u.floor}</span>
                <span><WBadge c={cov.c} bg={cov.bg}>{cov.label}</WBadge></span>
                <span style={{ textAlign: 'right' }}>
                  <WBtn size="sm" variant="ghost" icon={<IconPlus s={14} />} onClick={() => openInvite(u)}>Invite</WBtn>
                </span>
              </div>);

          })}
        </div>
      </WPanel>
    </div>);

}

function ClaimsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {window.DATA.CLAIMS.map((c) => {
        const cov = COV[c.ho6];
        return (
          <WCard key={c.id} hover style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(232,112,58,0.1)', color: WT.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconBolt s={24} /></div>
            <div style={{ minWidth: 130 }}>
              <div style={{ fontFamily: WT.mono, fontSize: 12, color: WT.faint }}>{c.id}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: WT.navy }}>Unit {c.unit} · {c.cause}</div>
            </div>
            <div style={{ flex: 1, fontSize: 13, color: WT.gray }}>{c.owner} · opened {c.opened}</div>
            <WBadge c={cov.c} bg={cov.bg}>{cov.label}</WBadge>
            <WBadge c={WT.navy} bg="rgba(14,42,71,0.06)">{c.stage}</WBadge>
            <WBtn size="sm" variant="secondary" icon={<IconArrow s={14} />}>Open</WBtn>
          </WCard>);

      })}
      <div style={{ fontSize: 12.5, color: WT.faint, padding: '4px 4px', display: 'flex', gap: 8 }}>
        <IconShield s={15} /> Claims on units without verified HO6 trigger a coverage gate before dispatch proceeds.
      </div>
    </div>);

}

function VendorsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <WPanel title="Master service agreement">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(31,168,160,0.12)', color: WT.teal, display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconShield s={30} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: WT.navy }}>Summit Restoration</div>
            <div style={{ fontSize: 13, color: WT.gray, marginTop: 2 }}>Priority dispatch · 4.9★ · response SLA 45 min</div>
          </div>
          <WBadge c={WT.tealDk} bg="rgba(31,168,160,0.12)"><IconCheck s={12} /> active MSA</WBadge>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: WT.gray, lineHeight: 1.5 }}>
          Owners who report damage through FirstCall are routed to Summit first. If no MSA were in place, claims would route to the highest-rated local crew by reviews.
        </div>
      </WPanel>
    </div>);

}

function InviteModal({ open, onClose, unit, onSend }) {
  const [email, setEmail] = puS('');
  React.useEffect(() => {if (open) setEmail('');}, [open, unit]);
  return (
    <WModal open={open} onClose={onClose} title="Invite owner" sub={unit ? `Send a FirstCall link for Unit ${unit.num}` : 'Send a FirstCall link to a unit owner'}>
      <WField label="Unit"><input readOnly value={unit ? `Unit ${unit.num} · ${unit.owner}` : ''} style={{ ...wInput, background: WT.wash }} /></WField>
      <WField label="Owner email" hint="They'll get a link to upload HO6 proof and report damage.">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@email.com" style={wInput} />
      </WField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <WBtn variant="secondary" onClick={onClose}>Cancel</WBtn>
        <WBtn variant="primary" icon={<IconArrow s={16} />} onClick={() => onSend(email)}>Send invite</WBtn>
      </div>
    </WModal>);

}

function PMApp() {
  const [page, setPage] = puS('coverage');
  const [units, setUnits] = puS(window.DATA.UNITS);
  const [coverage, setCoverage] = puS({ master: [...window.DATA.COVERAGE_DEFAULTS.master], ho6: [...window.DATA.COVERAGE_DEFAULTS.ho6] });
  const [selId, setSelId] = puS(18);
  const [invite, setInvite] = puS({ open: false, unit: null });
  const [toast, setToast] = puS('');
  const showToast = (m) => {setToast(m);setTimeout(() => setToast(''), 2600);};
  const openInvite = (unit) => setInvite({ open: true, unit });
  const titles = {
    coverage: ['HO6 vs. Master Policy', 'Coverage & liability'],
    units: ['Units & Owners', 'Harborview Condominiums'],
    claims: ['Active Claims', 'Coverage gating'],
    vendors: ['Vendors / MSA', 'Service agreements']
  };
  const [t0, t1] = titles[page];
  return (
    <Shell surface="pm" sublabel="PM / HOA Portal" tenant="Harborview HOA" nav={PM_NAV} page={page} onPage={setPage}
    title={t0} sub={t1}
    actions={<WBtn size="md" variant="primary" icon={<IconPlus s={16} />} onClick={() => openInvite(null)}>Invite owner</WBtn>}>
      {page === 'coverage' && <CoveragePage units={units} setUnits={setUnits} coverage={coverage} setCoverage={setCoverage} selId={selId} setSelId={setSelId} openInvite={openInvite} toast={showToast} />}
      {page === 'units' && <UnitsPage units={units} openInvite={openInvite} toast={showToast} />}
      {page === 'claims' && <ClaimsPage />}
      {page === 'vendors' && <VendorsPage />}
      <InviteModal open={invite.open} unit={invite.unit} onClose={() => setInvite({ open: false, unit: null })}
      onSend={() => {setInvite({ open: false, unit: null });showToast('Invitation sent');}} />
      <Toast msg={toast} />
    </Shell>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<PMApp />);