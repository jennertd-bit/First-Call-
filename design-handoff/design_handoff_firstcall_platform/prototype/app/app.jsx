// app.jsx — FirstCall owner-app prototype root
const { useState: uS, useEffect: uE, useRef: uR } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8703A",
  "tenant": "FirstCall",
  "vendor": "Summit Restoration",
  "msa": true,
  "reduceMotion": false
}/*EDITMODE-END*/;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

const FRESH = { role: null, cause: null, areas: [], media: [], note: '', nte: false };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [step, setStep] = uS('home');
  const [inp, setInp] = uS(FRESH);
  const [est, setEst] = uS(null);
  const [scale, setScale] = uS(1);
  const set = (patch) => setInp((s) => ({ ...s, ...patch }));

  // fit device to viewport
  uE(() => {
    const fit = () => {
      const m = 48;
      setScale(Math.min(1, (window.innerWidth - m) / 402, (window.innerHeight - m) / 874));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const go = (s) => setStep(s);
  const reset = () => { setInp(FRESH); setEst(null); go('home'); };
  const submitIntake = () => {
    const m = inp.media || [];
    const weight = m.reduce((s, x) => s + (x.kind === 'scan' ? 5 : x.kind === 'video' ? 2 : 1), 0);
    setEst(FC.buildEstimate({ cause: inp.cause, areas: inp.areas, photoCount: weight, opTier: '15/15' }));
    go('thinking');
  };

  let screen;
  if (step === 'home') screen = <HomeScreen msa={t.msa} tenant={t.tenant} vendor={t.vendor} onReport={() => go('role')} />;
  else if (step === 'role') screen = <RoleScreen role={inp.role} setRole={(role) => set({ role })} onBack={() => go('home')} onNext={() => go('intake')} />;
  else if (step === 'intake') screen = <IntakeScreen state={inp} set={set} onBack={() => go('role')} onSubmit={submitIntake} />;
  else if (step === 'thinking') screen = <ThinkingScreen reduceMotion={t.reduceMotion} onDone={() => go('ballpark')} />;
  else if (step === 'ballpark') screen = <BallparkScreen est={est} nte={inp.nte} setNte={(nte) => set({ nte })} media={inp.media} onBack={() => go('intake')} onDispatch={() => go('dispatch')} />;
  else if (step === 'dispatch') screen = <DispatchScreen msa={t.msa} vendor={t.vendor} nte={inp.nte} reduceMotion={t.reduceMotion} onHome={reset} />;

  const rootVars = {
    '--accent': t.accent,
    '--accent-30': rgba(t.accent, 0.30),
    '--accent-12': rgba(t.accent, 0.12),
  };

  return (
    <div style={{ ...rootVars, width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative',
      background: 'radial-gradient(120% 120% at 50% 0%, #14304d 0%, #0b1f33 55%, #081625 100%)',
      display: 'grid', placeItems: 'center', fontFamily: T.sans }}>

      {/* ambient brand glow */}
      <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 520, height: 520,
        borderRadius: '50%', background: rgba(t.accent, 0.10), filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* caption */}
      <div style={{ position: 'absolute', top: 22, left: 26, color: 'rgba(255,255,255,0.5)', fontFamily: T.mono,
        fontSize: 11, letterSpacing: '0.12em' }}>
        FIRSTCALL · OWNER APP<span style={{ color: rgba(t.accent, 0.9) }}> · THE FIRST CALL</span>
      </div>

      {/* surface switcher */}
      <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 30 }}>
        <a href="FirstCall%20Platform.html" title="Platform hub" style={{ display: 'grid', placeItems: 'center', width: 34, height: 34,
          borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#cdd9e6', textDecoration: 'none' }}>⌂</a>
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 11, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          {[['owner', 'Owner App', null], ['pm', 'PM Portal', 'FirstCall%20PM%20Portal.html'], ['crm', 'CRM', 'FirstCall%20Restoration%20CRM.html']].map(([id, label, href]) =>
            href ? (
              <a key={id} href={href} style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 500, color: '#9fb2c4',
                padding: '6px 11px', borderRadius: 8, textDecoration: 'none', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</a>
            ) : (
              <span key={id} style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)',
                padding: '6px 11px', borderRadius: 8, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</span>
            )
          )}
        </div>
      </div>

      {/* device */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', position: 'relative' }}>
        <IOSDevice>
          <div style={{ height: '100%', background: T.paper }}>
            <div key={step} style={{ height: '100%', animation: t.reduceMotion ? 'none' : 'fcScreenIn .42s cubic-bezier(.22,.8,.3,1)' }}>
              {screen}
            </div>
          </div>
        </IOSDevice>
      </div>

      {/* restart */}
      {step !== 'home' && (
        <button onClick={reset} title="Restart demo" style={{ position: 'absolute', bottom: 24, left: 26, display: 'flex',
          alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 99, cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#cdd9e6',
          fontFamily: T.mono, fontSize: 11.5, letterSpacing: '0.04em' }}>↺ Restart</button>
      )}

      <TweaksPanel>
        <TweakSection label="White-label brand" />
        <TweakColor label="Accent" value={t.accent}
          options={['#E8703A', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakText label="Tenant" value={t.tenant} onChange={(v) => setTweak('tenant', v)} />
        <TweakText label="Vendor" value={t.vendor} onChange={(v) => setTweak('vendor', v)} />
        <TweakSection label="Scenario" />
        <TweakToggle label="MSA on file" value={t.msa} onChange={(v) => setTweak('msa', v)} />
        <TweakToggle label="Reduce motion" value={t.reduceMotion} onChange={(v) => setTweak('reduceMotion', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
