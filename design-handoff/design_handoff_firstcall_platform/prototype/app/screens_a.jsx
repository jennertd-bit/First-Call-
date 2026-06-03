// screens_a.jsx — Home, Role gate, Guided intake
const SAMPLE_MATTERPORT = 'https://my.matterport.com/show/?m=demo3Dscan';

function AddBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px',
      borderRadius: 12, border: `1.5px dashed ${T.line}`, background: 'rgba(14,42,71,0.025)', color: T.navy, cursor: 'pointer' }}>
      <span style={{ color: T.gray }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function HomeScreen({ msa, tenant, vendor, onReport }) {
  return (
    <Screen>
      <Header brand tenant={tenant} />
      <Body>
        {msa ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: 'rgba(31,168,160,0.10)', border: '1px solid rgba(31,168,160,0.30)',
            borderRadius: 14, marginBottom: 18 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: T.teal, color: '#fff',
              display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconShield s={17} /></div>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.35 }}>
              <b style={{ color: T.navy }}>Covered by {vendor}</b>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: '#178a83', letterSpacing: '0.04em', marginTop: 1 }}>ACTIVE MSA · PRIORITY DISPATCH</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: 'rgba(14,42,71,0.04)', border: `1px solid ${T.line}`, borderRadius: 14, marginBottom: 18 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: T.navy, color: '#fff',
              display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconStar s={16} /></div>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.35 }}>
              <b style={{ color: T.navy }}>No vendor on file</b>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint, letterSpacing: '0.04em', marginTop: 1 }}>WE'LL ROUTE A TOP-RATED LOCAL CREW</div>
            </div>
          </div>
        )}

        <Label>Emergency?</Label>
        <Card sel style={{ marginTop: 10, padding: '26px 22px', background: 'var(--accent)',
          border: 'none', boxShadow: '0 14px 36px var(--accent-30)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
          onClick={onReport}>
          <div style={{ position: 'absolute', right: -28, top: -28, width: 150, height: 150, borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.18)',
              display: 'grid', placeItems: 'center', color: '#fff', marginBottom: 16 }}><IconBolt s={30} /></div>
            <div style={{ fontSize: 25, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Report damage</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 1.4, maxWidth: '24ch' }}>
              One tap. Get an instant ballpark and a crew on the way.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, fontFamily: T.mono,
              fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.04em' }}>
              START A CLAIM <IconArrow s={16} />
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ color: T.faint, marginBottom: 8 }}><IconHome s={20} /></div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.navy }}>Active claims</div>
            <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>None open</div>
          </Card>
          <Card style={{ padding: 16 }}>
            <div style={{ color: T.teal, marginBottom: 8 }}><IconPhone s={20} /></div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.navy }}>24/7 line</div>
            <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>Talk to a person</div>
          </Card>
        </div>

        <div style={{ marginTop: 18, textAlign: 'center', fontFamily: T.mono, fontSize: 10.5,
          color: T.faint, letterSpacing: '0.05em' }}>POWERED BY FIRSTCALL · AI + IICRC PRICING</div>
      </Body>
    </Screen>
  );
}

const ROLES = [
  { id: 'hoa',    label: 'HOA / Board contact', sub: 'Reporting for the association', Icon: IconUsers },
  { id: 'owner',  label: 'Unit owner',          sub: 'I own this unit',                Icon: IconUser },
  { id: 'tenant', label: 'Tenant',              sub: "I rent · I'll loop in the owner", Icon: IconHome },
];

function RoleScreen({ role, setRole, onBack, onNext }) {
  return (
    <Screen footer={<Button onClick={onNext} disabled={!role} variant="dark" icon={<IconArrow s={18} />}>Continue</Button>}>
      <Header title="Report damage" onBack={onBack} />
      <Body>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: T.navy, letterSpacing: '-0.02em', lineHeight: 1.12 }}>Who's reporting?</h2>
        <p style={{ fontSize: 14, color: T.gray, marginTop: 7, lineHeight: 1.45 }}>This sets how coverage is split between the building's master policy and your unit.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          {ROLES.map(({ id, label, sub, Icon }) => {
            const on = role === id;
            return (
              <Card key={id} sel={on} onClick={() => setRole(id)} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center',
                  background: on ? 'var(--accent)' : 'rgba(14,42,71,0.05)', color: on ? '#fff' : T.navy, transition: '.18s' }}>
                  <Icon s={23} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: T.navy }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: T.faint, marginTop: 2 }}>{sub}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${on ? 'var(--accent)' : T.line}`, background: on ? 'var(--accent)' : 'transparent',
                  display: 'grid', placeItems: 'center', color: '#fff' }}>{on && <IconCheck s={14} />}</div>
              </Card>
            );
          })}
        </div>
        {role === 'owner' && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 13, background: 'rgba(31,168,160,0.09)',
            border: '1px solid rgba(31,168,160,0.28)', fontSize: 12.5, color: '#15706b', lineHeight: 1.45 }}>
            <b>HO6 separation on.</b> We'll keep your unit-owner costs (paint, finishes, flooring) separate from the master policy automatically.
          </div>
        )}
      </Body>
    </Screen>
  );
}

function IntakeScreen({ state, set, onBack, onSubmit }) {
  const { cause, areas } = state;
  const media = state.media || [];
  const stepN = (cause ? 1 : 0) + (media.length ? 1 : 0) + (areas.length || state.note ? 1 : 0);
  const toggleArea = (id) => set({ areas: areas.includes(id) ? areas.filter((a) => a !== id) : [...areas, id] });

  const photoRef = useRef(null), videoRef = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkVal, setLinkVal] = useState('');
  const uid = () => 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const addMedia = (items) => set({ media: [...media, ...items] });
  const rmMedia = (id) => set({ media: media.filter((m) => m.id !== id) });
  const onFiles = (e, kind) => {
    const files = [...e.target.files];
    addMedia(files.map((f) => ({ id: uid(), kind, name: f.name,
      url: (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL(f) : null })));
    e.target.value = '';
  };
  const addLink = () => {
    const v = linkVal.trim(); if (!v) return;
    const isScan = /matterport|\/show|3d|scan/i.test(v);
    let host = v; try { host = new URL(v).hostname.replace('www.', ''); } catch (err) {}
    addMedia([{ id: uid(), kind: isScan ? 'scan' : 'link', name: isScan ? 'Matterport 3D scan' : host, url: v }]);
    setLinkVal(''); setLinkOpen(false);
  };

  return (
    <Screen footer={
      <Button onClick={onSubmit} disabled={!cause} icon={<IconSpark s={18} />}>Get my ballpark</Button>
    }>
      <Header title="Tell us what happened" onBack={onBack} />
      <Steps n={stepN} />
      <Body style={{ paddingTop: 16 }}>
        {/* 1 — cause */}
        <Label>1 · Cause of loss</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {FC.CAUSES.map((c) => {
            const on = cause === c.id; const Icon = CAUSE_ICONS[c.id];
            const span = c.id === 'other' ? { gridColumn: '1 / -1' } : {};
            return (
              <Card key={c.id} sel={on} onClick={() => set({ cause: c.id })}
                style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, ...span }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center',
                  background: on ? 'var(--accent)' : 'rgba(14,42,71,0.05)', color: on ? '#fff' : T.navy, transition: '.18s' }}>
                  <Icon s={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: T.navy }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{c.sub}</div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 2 — evidence */}
        <Label style={{ marginTop: 24 }}>2 · Add evidence <span style={{ color: T.faint }}>· {media.length} item{media.length === 1 ? '' : 's'}</span></Label>
        <input ref={photoRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e, 'photo')} style={{ display: 'none' }} />
        <input ref={videoRef} type="file" accept="video/*" multiple onChange={(e) => onFiles(e, 'video')} style={{ display: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
          <AddBtn icon={<IconCamera s={18} />} label="Photos" onClick={() => photoRef.current && photoRef.current.click()} />
          <AddBtn icon={<IconVideo s={18} />} label="Video" onClick={() => videoRef.current && videoRef.current.click()} />
          <AddBtn icon={<IconCube s={18} />} label="Matterport" onClick={() => { setLinkOpen(true); setLinkVal(SAMPLE_MATTERPORT); }} />
        </div>
        {linkOpen && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={linkVal} onChange={(e) => setLinkVal(e.target.value)} placeholder="Paste a Matterport or any link…" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              style={{ flex: 1, borderRadius: 11, padding: '11px 12px', border: `1px solid ${T.line}`, background: T.card,
                fontFamily: T.sans, fontSize: 13, color: T.ink, outline: 'none', minWidth: 0 }} />
            <Button onClick={addLink} variant="dark" style={{ width: 'auto', padding: '11px 18px' }}>Add</Button>
          </div>
        )}
        {media.some((m) => m.kind === 'photo' || m.kind === 'video') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
            {media.filter((m) => m.kind === 'photo' || m.kind === 'video').map((m) => (
              <div key={m.id} style={{ aspectRatio: '1', borderRadius: 12, position: 'relative', overflow: 'hidden',
                background: m.kind === 'photo' && m.url ? `center/cover no-repeat url(${m.url})` : 'linear-gradient(135deg,#37475a,#1b2733)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}>
                <button onClick={() => rmMedia(m.id)} style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><IconClose s={11} /></button>
                <div style={{ position: 'absolute', bottom: 4, left: 5, color: 'rgba(255,255,255,0.9)' }}>{m.kind === 'video' ? <IconVideo s={13} /> : <IconCamera s={13} />}</div>
              </div>
            ))}
          </div>
        )}
        {media.filter((m) => m.kind === 'scan' || m.kind === 'link').map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '10px 12px', borderRadius: 12,
            background: m.kind === 'scan' ? 'rgba(31,168,160,0.08)' : T.card, border: `1px solid ${m.kind === 'scan' ? 'rgba(31,168,160,0.3)' : T.line}` }}>
            <div style={{ color: m.kind === 'scan' ? T.teal : T.navy, flexShrink: 0 }}>{m.kind === 'scan' ? <IconCube s={18} /> : <IconLink s={16} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{m.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.url}</div>
            </div>
            <button onClick={() => rmMedia(m.id)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(14,42,71,0.06)', color: T.gray, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}><IconClose s={12} /></button>
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 8, lineHeight: 1.4 }}>Photos, video, or a Matterport / 3D scan — by file or link. Richer evidence sharpens the estimate.</div>

        {/* 3 — affected areas + note */}
        <Label style={{ marginTop: 24 }}>3 · What's affected?</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {FC.AREAS.map((a) => {
            const on = areas.includes(a.id);
            return (
              <button key={a.id} onClick={() => toggleArea(a.id)} style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 500,
                padding: '9px 14px', borderRadius: 11, cursor: 'pointer', transition: '.16s',
                border: `1px solid ${on ? 'var(--accent)' : T.line}`,
                background: on ? 'var(--accent)' : T.card, color: on ? '#fff' : T.ink,
                boxShadow: on ? '0 4px 12px var(--accent-30)' : T.shadowSm }}>{a.label}</button>
            );
          })}
        </div>
        <textarea value={state.note} onChange={(e) => set({ note: e.target.value })}
          placeholder="Anything else we should know? (optional)"
          style={{ width: '100%', marginTop: 14, minHeight: 78, resize: 'none', borderRadius: 14, padding: '12px 14px',
            border: `1px solid ${T.line}`, background: T.card, fontFamily: T.sans, fontSize: 14, color: T.ink,
            boxShadow: T.shadowSm, outline: 'none', lineHeight: 1.45 }} />
      </Body>
    </Screen>
  );
}

Object.assign(window, { HomeScreen, RoleScreen, IntakeScreen });
