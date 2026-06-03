// screens_b.jsx — Thinking, AI ballpark, Dispatch & track
const { useState: useS2, useEffect: useE2, useRef: useR2 } = React;

const THINK_STEPS = [
  'Reading your photos',
  'Classifying damage & affected materials',
  'Matching IICRC drying standards',
  'Pricing against 21,408 T&M items',
  'Applying O&P tier & coverage split',
];

function ThinkingScreen({ reduceMotion, onDone }) {
  const [done, setDone] = useS2(0);
  useE2(() => {
    const gap = reduceMotion ? 130 : 620;
    const timers = THINK_STEPS.map((_, i) => setTimeout(() => setDone(i + 1), gap * (i + 1)));
    const fin = setTimeout(onDone, gap * (THINK_STEPS.length + 1.2));
    return () => { timers.forEach(clearTimeout); clearTimeout(fin); };
  }, []);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: `${SAFE_TOP}px ${PAD}px ${SAFE_BOT}px`, background: `linear-gradient(160deg, ${T.navy}, #091a2c 78%)` }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 30 }}>
        <div style={{ width: 86, height: 86, borderRadius: 26, background: 'var(--accent)', display: 'grid', placeItems: 'center',
          color: '#fff', boxShadow: '0 0 0 12px rgba(255,255,255,0.04), 0 16px 40px var(--accent-30)',
          animation: reduceMotion ? 'none' : 'fcPulse 1.6s ease-in-out infinite' }}>
          <IconSpark s={42} />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Building your ballpark</div>
        <div style={{ fontSize: 13.5, color: '#9fb2c4', marginTop: 6 }}>AI vision + IICRC standards + your vendor's pricing</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {THINK_STEPS.map((s, i) => {
          const isDone = i < done, active = i === done;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: isDone || active ? 1 : 0.4,
              transition: 'opacity .3s' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                background: isDone ? T.teal : 'rgba(255,255,255,0.10)', color: '#fff',
                border: active ? '2px solid var(--accent)' : '2px solid transparent', transition: '.25s' }}>
                {isDone ? <IconCheck s={14} /> : active && !reduceMotion
                  ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'fcBlink 0.9s infinite' }} />
                  : null}
              </div>
              <div style={{ fontSize: 14, color: isDone ? '#cdd9e6' : '#fff', fontWeight: active ? 600 : 400 }}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfPill({ level }) {
  const c = level === 'High' ? T.teal : level === 'Medium' ? '#C98A2B' : '#B5524B';
  const bg = level === 'High' ? 'rgba(31,168,160,0.14)' : level === 'Medium' ? 'rgba(201,138,43,0.14)' : 'rgba(181,82,75,0.14)';
  return <span style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: c,
    background: bg, padding: '3px 9px', borderRadius: 99 }}>{level.toUpperCase()} CONFIDENCE</span>;
}

function BallparkScreen({ est, nte, setNte, media = [], onBack, onDispatch }) {
  const { fmt } = FC;
  const photoN = media.filter((m) => m.kind === 'photo').length;
  const videoN = media.filter((m) => m.kind === 'video').length;
  const scanN = media.filter((m) => m.kind === 'scan').length;
  const linkN = media.filter((m) => m.kind === 'link').length;
  const parts = [];
  if (photoN) parts.push(photoN + ' photo' + (photoN > 1 ? 's' : ''));
  if (videoN) parts.push(videoN + ' video' + (videoN > 1 ? 's' : ''));
  if (scanN) parts.push('Matterport scan');
  if (linkN) parts.push(linkN + ' link' + (linkN > 1 ? 's' : ''));
  const summary = parts.length ? parts.join(' · ') : 'no media yet';
  return (
    <Screen footer={
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Button onClick={onDispatch} icon={<IconArrow s={18} />}>
          {nte ? 'Approve & dispatch a crew' : 'Dispatch a crew'}
        </Button>
        <Disclaimer style={{ padding: '2px 2px 0' }} />
      </div>
    }>
      <Header title="Your ballpark" onBack={onBack} />
      <Body>
        {/* hero total */}
        <Card style={{ padding: '20px 20px 18px', background: T.navy, border: 'none', boxShadow: '0 14px 34px rgba(14,42,71,0.28)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label style={{ color: 'rgba(255,255,255,0.6)' }}>Estimated ballpark</Label>
            <ConfPill level={est.confidence} />
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1 }}>
            {fmt(est.ballpark)}
          </div>
          <div style={{ fontSize: 13, color: '#9fb2c4', marginTop: 8, fontFamily: T.mono }}>
            Range {fmt(est.low)} – {fmt(est.high)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '18%', right: '18%', top: 0, bottom: 0, background: 'var(--accent)', borderRadius: 5 }} />
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: '#7d8fa0', marginTop: 10 }}>Based on {summary} · AI + IICRC + your vendor's price list</div>
        </Card>

        {/* line items */}
        <Label style={{ marginTop: 22 }}>What's included</Label>
        <Card style={{ marginTop: 10, padding: '4px 16px' }}>
          {est.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '12px 0',
              borderBottom: i < est.items.length - 1 ? `1px solid ${T.hairline}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.3 }}>{it.label}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint, marginTop: 2, letterSpacing: '0.02em' }}>
                  {it.qty > 1 ? `${it.qty} × ${fmt(it.unitRaw)}` : (it.note || (it.bucket === 'ho6' ? 'Unit owner (HO6)' : 'Master policy'))}
                </div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 13.5, fontWeight: 500, color: T.navy }}>{fmt(it.raw)}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12, padding: '0 4px' }}>
          <Row k="Labor · materials · equipment" v={fmt(est.rawSubtotal)} />
          <Row k={`Overhead & profit (${est.opTier})`} v={fmt(est.markup)} />
          <div style={{ height: 1, background: T.line, margin: '4px 0' }} />
          <Row k="Ballpark total" v={fmt(est.ballpark)} bold />
        </div>

        {/* NTE consent */}
        <Card style={{ marginTop: 18, padding: 16 }} onClick={() => setNte(!nte)} sel={nte}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 46, height: 28, borderRadius: 99, flexShrink: 0, padding: 3, transition: '.2s',
              background: nte ? 'var(--accent)' : 'rgba(14,42,71,0.14)', display: 'flex',
              justifyContent: nte ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.navy }}>Approve as not-to-exceed</div>
              <div style={{ fontSize: 12, color: T.faint, marginTop: 2, lineHeight: 1.4 }}>
                {nte ? `You won't be billed above ${fmt(est.high)} without your sign-off.`
                     : 'Accept as a ballpark — final scope is confirmed on-site.'}
              </div>
            </div>
          </div>
        </Card>
      </Body>
    </Screen>
  );
}

function Row({ k, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: bold ? 14.5 : 12.5, color: bold ? T.navy : T.gray, fontWeight: bold ? 600 : 400 }}>{k}</span>
      <span style={{ fontFamily: T.mono, fontSize: bold ? 16 : 12.5, fontWeight: bold ? 600 : 500, color: T.navy }}>{v}</span>
    </div>
  );
}

const DISPATCH_STAGES = [
  { k: 'Request received',   d: 'Your report reached dispatch' },
  { k: 'Crew dispatched',    d: 'Team is en route to you' },
  { k: 'On-site inspection', d: 'Scope confirmed in person' },
  { k: 'Contract & start',   d: 'Signed after inspection — in the CRM' },
];

function DispatchScreen({ msa, vendor, nte, reduceMotion, onHome }) {
  const [stage, setStage] = useS2(reduceMotion ? 2 : 0);
  const [placed, setPlaced] = useS2(reduceMotion);
  useE2(() => {
    if (reduceMotion) { setPlaced(true); return; }
    const t0 = setTimeout(() => setPlaced(true), 1300);
    const t1 = setTimeout(() => setStage(1), 2400);
    const t2 = setTimeout(() => setStage(2), 4200);
    return () => [t0, t1, t2].forEach(clearTimeout);
  }, []);

  const eta = 32;
  return (
    <Screen footer={<Button onClick={onHome} variant="secondary">Back to home</Button>}>
      <Header title="Dispatch" onBack={onHome} right={null} />
      <Body>
        {!placed ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: '50px 0 30px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 22 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--accent-12)',
                animation: reduceMotion ? 'none' : 'fcRipple 1.4s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                display: 'grid', placeItems: 'center', boxShadow: '0 10px 28px var(--accent-30)' }}><IconPhone s={28} /></div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: T.navy }}>Your call is being placed…</div>
            <div style={{ fontSize: 13.5, color: T.faint, marginTop: 6 }}>Connecting you with the right crew</div>
          </div>
        ) : (
          <div style={{ animation: 'fcFadeUp .4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.teal, color: '#fff', display: 'grid', placeItems: 'center' }}><IconCheck s={15} /></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Crew on the way</div>
            </div>

            {/* vendor card */}
            <Card style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: 'rgba(14,42,71,0.05)',
                display: 'grid', placeItems: 'center', color: T.navy }}><IconTruck s={26} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.navy }}>{msa ? vendor : 'Summit Restoration Co.'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontFamily: T.mono, fontSize: 11.5, color: T.gray, whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#E8A53A', display: 'inline-flex' }}><IconStar s={13} /></span>
                  <span>4.9</span><span style={{ color: T.faint }}>·</span>
                  <span>{msa ? 'MSA partner' : 'top-rated local'}</span><span style={{ color: T.faint }}>·</span>
                  <span>ETA&nbsp;{eta}m</span>
                </div>
              </div>
            </Card>

            {/* timeline */}
            <Label style={{ marginTop: 22 }}>Status</Label>
            <div style={{ marginTop: 12, position: 'relative' }}>
              {DISPATCH_STAGES.map((s, i) => {
                const done = i < stage, active = i === stage;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < DISPATCH_STAGES.length - 1 ? 20 : 0, position: 'relative' }}>
                    {i < DISPATCH_STAGES.length - 1 && (
                      <div style={{ position: 'absolute', left: 12, top: 26, bottom: 0, width: 2,
                        background: done ? T.teal : T.line, transition: 'background .4s' }} />
                    )}
                    <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, zIndex: 1, display: 'grid', placeItems: 'center',
                      background: done ? T.teal : active ? 'var(--accent)' : T.card, color: '#fff',
                      border: done || active ? 'none' : `2px solid ${T.line}`,
                      boxShadow: active ? '0 0 0 4px var(--accent-12)' : 'none', transition: '.35s' }}>
                      {done ? <IconCheck s={15} /> : active ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> : null}
                    </div>
                    <div style={{ paddingTop: 2, opacity: done || active ? 1 : 0.5, transition: 'opacity .35s' }}>
                      <div style={{ fontSize: 14.5, fontWeight: active ? 700 : 600, color: T.navy }}>
                        {s.k}{active && i === 2 ? ` · ${eta}m` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{s.d}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 22, padding: '12px 14px', borderRadius: 13, background: 'rgba(14,42,71,0.04)',
              border: `1px solid ${T.line}`, display: 'flex', gap: 10 }}>
              <div style={{ color: T.navy, flexShrink: 0, marginTop: 1 }}><IconDoc s={17} /></div>
              <div style={{ fontSize: 12.5, color: T.gray, lineHeight: 1.45 }}>
                <b style={{ color: T.navy }}>No contract yet.</b> You'll sign only after the on-site inspection confirms scope.
                {nte && <span> Your <b style={{ color: T.navy }}>not-to-exceed</b> approval is attached to this claim.</span>}
              </div>
            </div>
          </div>
        )}
      </Body>
    </Screen>
  );
}

Object.assign(window, { ThinkingScreen, BallparkScreen, DispatchScreen });
