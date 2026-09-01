import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GreenGoldLogo from './GreenGoldLogo';

function useCountUp(target, duration = 2200, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let s = null;
    const run = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
      setValue(Math.round(e * target));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [target, started, duration]);
  return value;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeBins: 0, totalCarbonCredits: 0, totalUsers: 0 });
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const metricsRef = useRef(null);

  useEffect(() => {
    fetch('/api/iot/public-stats')
      .then(r => r.json())
      .then(d => { if (d.success && d.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.2 });
    if (metricsRef.current) obs.observe(metricsRef.current);
    return () => obs.disconnect();
  }, [ready]);

  const cc    = useCountUp(Math.round(stats.totalCarbonCredits), 2400, started);
  const bins  = useCountUp(stats.activeBins, 1800, started);
  const users = useCountUp(stats.totalUsers, 2000, started);

  const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

  return (
    <div style={{ fontFamily: FONT, background: '#F9FAFB', minHeight: '100vh', color: '#111827' }}>

      {/* ══ NAVBAR ══ */}
      <header style={{
        position: 'fixed', inset: '0 0 auto 0', zIndex: 300,
        background: 'rgba(249,250,251,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(17,24,39,0.06)',
        height: '60px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px'
      }}>
        <GreenGoldLogo size={38} subtitle="Smart Waste OS" subtextColor="#059669" />
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="#how" style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#111827'}
            onMouseLeave={e => e.target.style.color = '#6B7280'}>
            How it works
          </a>
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 20px', borderRadius: '8px',
            background: '#111827', color: '#FFFFFF',
            border: 'none', fontWeight: '600', fontSize: '13px',
            cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.01em',
            transition: 'opacity 0.15s'
          }}
            onMouseEnter={e => e.target.style.opacity = '0.8'}
            onMouseLeave={e => e.target.style.opacity = '1'}>
            Sign in
          </button>
        </nav>
      </header>

      {/* ══ HERO — SPLIT LAYOUT ══ */}
      <section style={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', padding: '100px 0 60px', maxWidth: '1200px',
        margin: '0 auto', gap: '60px'
      }}>
        {/* Left — Copy */}
        <div style={{ padding: '0 48px' }}>
          <div style={{
            display: 'inline-block', fontSize: '11px', fontWeight: '800',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#059669', marginBottom: '24px'
          }}>
            Rawalpindi · Islamabad
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 4.5vw, 62px)', fontWeight: '900',
            lineHeight: '1.05', letterSpacing: '-0.04em',
            color: '#111827', margin: '0 0 24px'
          }}>
            Waste management,<br />
            <span style={{
              background: 'linear-gradient(135deg, #065F46, #10B981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              reengineered.
            </span>
          </h1>

          <p style={{
            fontSize: '16px', color: '#6B7280', lineHeight: '1.7',
            margin: '0 0 40px', maxWidth: '420px', fontWeight: '400'
          }}>
            An integrated operating system connecting smart bins, collectors, recycling plants and carbon registries — end to end, in real time.
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '13px 30px', borderRadius: '10px',
              background: '#059669', color: '#FFFFFF',
              border: 'none', fontWeight: '700', fontSize: '14px',
              cursor: 'pointer', fontFamily: FONT,
              boxShadow: '0 4px 14px rgba(5,150,105,0.30)',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.target.style.background='#047857'; e.target.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.background='#059669'; e.target.style.transform='translateY(0)'; }}>
              Access Portal →
            </button>
            <a href="#how" style={{
              padding: '13px 24px', borderRadius: '10px',
              background: 'transparent', color: '#374151',
              border: '1px solid #E5E7EB', fontWeight: '600', fontSize: '14px',
              cursor: 'pointer', fontFamily: FONT, textDecoration: 'none',
              transition: 'border-color 0.2s', display: 'inline-flex', alignItems: 'center'
            }}
              onMouseEnter={e => e.target.style.borderColor = '#9CA3AF'}
              onMouseLeave={e => e.target.style.borderColor = '#E5E7EB'}>
              See how it works
            </a>
          </div>
        </div>

        {/* Right — Live Data Preview Card */}
        <div style={{ padding: '0 48px 0 0' }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            {/* Card header bar */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#FAFAFA'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FCA5A5' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FCD34D' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6EE7B7' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', marginLeft: '4px' }}>
                GreenGold OS — Live Platform Metrics
              </span>
            </div>

            {/* Metrics rows */}
            <div style={{ padding: '8px 0' }}>
              {[
                { label: 'Carbon Credits Minted', value: ready ? stats.totalCarbonCredits.toFixed(2) + ' CC' : '—', accent: '#059669', dot: '#6EE7B7' },
                { label: 'Smart Bins Active',     value: ready ? stats.activeBins                              : '—', accent: '#0369A1', dot: '#93C5FD' },
                { label: 'Registered Users',      value: ready ? stats.totalUsers                              : '—', accent: '#7C3AED', dot: '#C4B5FD' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < 2 ? '1px solid #F9FAFB' : 'none',
                  transition: 'background 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: row.accent, letterSpacing: '-0.02em' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div style={{
              padding: '12px 20px', background: '#F9FAFB',
              borderTop: '1px solid #F3F4F6',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6EE7B7' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600' }}>
                Fetched live from MongoDB · Updates every 4 seconds
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FULL-WIDTH DARK METRICS BAND ══ */}
      <section ref={metricsRef} style={{
        background: '#111827',
        padding: '80px 48px'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0'
        }}>
          {[
            { val: cc,    suf: ' CC',  label: 'Carbon Credits',   sub: 'Minted from verified recycling batches' },
            { val: bins,  suf: '',     label: 'Active Bins',       sub: 'IoT smart bins transmitting live telemetry' },
            { val: users, suf: '',     label: 'Registered Users',  sub: 'Across all stakeholder roles in the platform' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '0 48px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none'
            }}>
              <div style={{
                fontSize: 'clamp(52px, 6vw, 80px)', fontWeight: '900',
                letterSpacing: '-0.05em', lineHeight: '1', color: '#FFFFFF',
                marginBottom: '14px', fontVariantNumeric: 'tabular-nums'
              }}>
                {m.val.toLocaleString()}{m.suf}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#D1D5DB', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: '1.5', maxWidth: '240px' }}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how" style={{ padding: '100px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '12px' }}>
              The Pipeline
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: '800', letterSpacing: '-0.03em', color: '#111827', margin: 0, lineHeight: '1.1' }}>
              Sensor to carbon credit.<br />No manual steps.
            </h2>
          </div>
          <button onClick={() => navigate('/login')} style={{
            padding: '12px 24px', borderRadius: '8px',
            background: 'transparent', color: '#059669',
            border: '1.5px solid #059669', fontWeight: '700', fontSize: '13px',
            cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.01em',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => { e.target.style.background = '#059669'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#059669'; }}>
            Access Platform →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: '#E5E7EB', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          {[
            { n: '01', title: 'Bin Telemetry', body: 'Proteus smart bins transmit fill level, weight and gas readings via UART serial every 3 seconds through the hardware bridge.' },
            { n: '02', title: 'Auto Dispatch',  body: 'At 86% capacity, the OS instantly generates a waste collection request and alerts the logistics queue — zero manual input.' },
            { n: '03', title: 'Collection & Transport', body: 'Collectors confirm pickup. Waste moves to the dump facility, is separated by stream, then dispatched to recycling plants.' },
            { n: '04', title: 'Carbon Minting', body: 'Recycling plants log verified output. The platform calculates CO₂ avoidance and issues carbon credits automatically.' },
          ].map((step, i) => (
            <div key={i} style={{
              background: '#FFFFFF', padding: '36px 28px',
              transition: 'background 0.2s'
            }}>
              <div style={{
                fontSize: '11px', fontWeight: '900', letterSpacing: '0.12em',
                color: i === 0 ? '#059669' : '#D1D5DB',
                marginBottom: '24px'
              }}>{step.n}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '10px', letterSpacing: '-0.01em', lineHeight: '1.3' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: '1.65' }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ROLES STRIP ══ */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '60px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '36px', textAlign: 'center' }}>
            7 Role-Based Portals
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {['Management Hub', 'Customer Portal', 'Technician', 'Waste Collector', 'Dump Facility', 'Transporter', 'Recycling Plant'].map((role, i) => (
              <div key={i} style={{
                padding: '8px 18px', borderRadius: '999px',
                border: '1px solid #E5E7EB', background: '#F9FAFB',
                fontSize: '13px', fontWeight: '600', color: '#374151',
                letterSpacing: '-0.01em', transition: 'all 0.15s', cursor: 'default'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#059669'; e.target.style.color = '#059669'; e.target.style.background = '#F0FDF4'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#374151'; e.target.style.background = '#F9FAFB'; }}>
                {role}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
          borderRadius: '20px', padding: '72px 64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '32px', position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative rings */}
          <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: '14px', color: '#6EE7B7', margin: 0, fontWeight: '500' }}>
              Log in to access your role-based portal.
            </p>
          </div>
          <button onClick={() => navigate('/login')} style={{
            position: 'relative', zIndex: 1,
            padding: '14px 32px', borderRadius: '10px',
            background: '#FFFFFF', color: '#065F46',
            border: 'none', fontWeight: '800', fontSize: '14px',
            cursor: 'pointer', fontFamily: FONT,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.30)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'; }}>
            Access Portal →
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        borderTop: '1px solid #F3F4F6', padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px', maxWidth: '1200px', margin: '0 auto'
      }}>
        <GreenGoldLogo size={28} subtitle="" />
        <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
          GreenGold OS · Rawalpindi &amp; Islamabad · IoT + MongoDB + React
        </span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 900px) {
          section:first-of-type { grid-template-columns: 1fr !important; }
          section:first-of-type > div:last-child { display: none; }
        }
        @media (max-width: 700px) {
          header { padding: 0 20px !important; }
          section, footer { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  );
}
