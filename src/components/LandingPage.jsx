import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GreenGoldLogo from './GreenGoldLogo';

function useCountUp(target, duration = 2000, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let startTs = null;
    const animate = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, started, duration]);
  return value;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeBins: 0, totalCarbonCredits: 0, totalUsers: 0 });
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    fetch('/api/iot/public-stats')
      .then(r => r.json())
      .then(d => { if (d.success && d.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [ready]);

  const bins  = useCountUp(stats.activeBins, 1800, started);
  const cc    = useCountUp(Math.round(stats.totalCarbonCredits * 100) / 100 === 0 ? 0 : Math.round(stats.totalCarbonCredits), 2200, started);
  const users = useCountUp(stats.totalUsers, 1600, started);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", background: '#FAFAFA', minHeight: '100vh', color: '#0A0A0A' }}>

      {/* ─── NAVBAR ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(250,250,250,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 56px'
      }}>
        <GreenGoldLogo size={40} subtitle="Smart Waste OS" subtextColor="#059669" />
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '9px 24px', borderRadius: '8px',
            background: '#0A0A0A', color: '#FFFFFF',
            border: 'none', fontWeight: '600', fontSize: '13.5px',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={e => e.target.style.opacity = '0.75'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Sign in
        </button>
      </header>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 56px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }} />
        {/* Green radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '800px', height: '500px', zIndex: 0,
          background: 'radial-gradient(ellipse at center, rgba(5,150,105,0.10) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: '900',
            lineHeight: '1.03', letterSpacing: '-0.04em', margin: '0 0 28px',
            color: '#0A0A0A'
          }}>
            The Operating System<br />
            <span style={{ color: '#059669' }}>for Sustainable Cities</span>
          </h1>

          <p style={{
            fontSize: '18px', color: '#6B7280', lineHeight: '1.65',
            maxWidth: '560px', margin: '0 auto 48px', fontWeight: '400'
          }}>
            GreenGold OS connects IoT smart bins, waste collectors, recycling plants,
            and carbon registries into a single real-time platform.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 36px', borderRadius: '10px',
                background: '#059669', color: '#FFFFFF',
                border: 'none', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                boxShadow: '0 4px 16px rgba(5,150,105,0.30)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = '#047857'; e.target.style.boxShadow = '0 6px 24px rgba(5,150,105,0.40)'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.background = '#059669'; e.target.style.boxShadow = '0 4px 16px rgba(5,150,105,0.30)'; e.target.style.transform = 'translateY(0)'; }}
            >
              Access Portal
            </button>
            <a
              href="#metrics"
              style={{
                padding: '14px 30px', borderRadius: '10px',
                background: 'transparent', color: '#374151',
                border: '1px solid #D1D5DB', fontWeight: '600', fontSize: '15px',
                cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
                letterSpacing: '-0.01em', transition: 'all 0.2s', display: 'inline-block'
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#9CA3AF'; e.target.style.background = '#FFFFFF'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#D1D5DB'; e.target.style.background = 'transparent'; }}
            >
              View Live Data
            </a>
          </div>
        </div>
      </section>

      {/* ─── LIVE METRICS ─── */}
      <section id="metrics" ref={statsRef} style={{
        background: '#FFFFFF',
        borderTop: '1px solid #F3F4F6',
        borderBottom: '1px solid #F3F4F6',
        padding: '100px 56px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{
            fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '64px',
            textAlign: 'center'
          }}>
            Platform Metrics — Pulled Live from Database
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: '#F3F4F6',
            border: '1px solid #F3F4F6',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            {[
              {
                value: cc,
                suffix: ' CC',
                label: 'Carbon Credits Minted',
                desc: 'Total carbon credits issued on the registry from verified recycling batches.'
              },
              {
                value: bins,
                suffix: '',
                label: 'Active Smart Bins',
                desc: 'IoT-enabled bins currently deployed and transmitting telemetry in the field.'
              },
              {
                value: users,
                suffix: '',
                label: 'Registered Users',
                desc: 'Stakeholders across all 7 roles — management, collectors, transporters and more.'
              }
            ].map((metric, i) => (
              <div key={i} style={{
                background: '#FFFFFF', padding: '52px 44px',
                display: 'flex', flexDirection: 'column', gap: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(44px, 6vw, 72px)',
                  fontWeight: '900',
                  letterSpacing: '-0.04em',
                  lineHeight: '1',
                  color: '#0A0A0A',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {metric.value.toLocaleString()}{metric.suffix}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', maxWidth: '260px' }}>
                    {metric.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PIPELINE SECTION ─── */}
      <section style={{ padding: '100px 56px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '16px' }}>
            How It Works
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#0A0A0A', margin: 0, maxWidth: '520px', lineHeight: '1.15' }}>
            Sensor to carbon credit.<br />Fully automated.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: '#F3F4F6', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
          {[
            { n: '01', title: 'Smart Bin Telemetry', body: 'Proteus-simulated bins transmit fill level, weight and gas concentration via UART serial every 3 seconds to the bridge service.' },
            { n: '02', title: 'Automatic Collection Dispatch', body: 'When fill exceeds 86%, the system auto-creates an urgent waste collection ticket routed directly to the logistics queue.' },
            { n: '03', title: 'Collector & Transport Chain', body: 'Collectors confirm pickup on their portal. Waste moves to the dump facility, is separated by stream, then dispatched to recycling plants.' },
            { n: '04', title: 'Carbon Credit Issuance', body: 'Recycling plants log verified output. The platform calculates carbon avoidance and mints credits to the organisation\'s registry account.' },
          ].map((step, i) => (
            <div key={i} style={{ background: '#FFFFFF', padding: '40px 36px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.10em', color: '#D1D5DB', marginBottom: '20px' }}>
                {step.n}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0A0A0A', marginBottom: '10px', letterSpacing: '-0.01em' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: '1.65' }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{
        margin: '0 56px 80px',
        background: '#0A0A0A',
        borderRadius: '20px',
        padding: '80px 64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '32px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle green accent */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Ready to get started?
          </div>
          <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Log in with your credentials to access your role-based portal.
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            position: 'relative', zIndex: 1,
            padding: '14px 32px', borderRadius: '10px',
            background: '#059669', color: '#FFFFFF',
            border: 'none', fontWeight: '700', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
            boxShadow: '0 4px 20px rgba(5,150,105,0.40)',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => { e.target.style.background = '#047857'; e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.target.style.background = '#059669'; e.target.style.transform = 'translateY(0)'; }}
        >
          Access Portal
        </button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: '1px solid #F3F4F6', padding: '28px 56px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <GreenGoldLogo size={30} subtitle="" />
        <div style={{ fontSize: '12px', color: '#D1D5DB', letterSpacing: '0.01em' }}>
          GreenGold OS &nbsp;·&nbsp; Rawalpindi &amp; Islamabad &nbsp;·&nbsp; IoT · MongoDB · React
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          header { padding: 0 24px !important; }
          section, footer { padding-left: 24px !important; padding-right: 24px !important; }
          section[id="metrics"] > div > div { grid-template-columns: 1fr !important; }
          section:last-of-type > div { grid-template-columns: 1fr !important; }
          section[style*="padding: '100px 56px'"] > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
