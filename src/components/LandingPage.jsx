import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GreenGoldLogo from './GreenGoldLogo';

const API_BASE = '/api';

// Animated counter hook
function useCountUp(target, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started || target === 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target, started, duration]);
  return value;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/iot/public-stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Trigger counter animation when stats section scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const bins = useCountUp(stats?.activeBins || 0, 1500, statsVisible);
  const clients = useCountUp(stats?.activeClients || 0, 1500, statsVisible);
  const cc = useCountUp(Math.round(stats?.totalCarbonCredits || 0), 2000, statsVisible);
  const wasteKg = useCountUp(stats?.totalWasteKg || 0, 2000, statsVisible);
  const pickups = useCountUp(stats?.completedPickups || 0, 1500, statsVisible);
  const batches = useCountUp(stats?.recyclingBatches || 0, 1500, statsVisible);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", background: '#F8FAF8', minHeight: '100vh', color: '#0F172A' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 48px', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <GreenGoldLogo size={44} subtitle="Smart Waste OS" subtextColor="#059669" />
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 28px', borderRadius: '10px',
            background: '#059669', color: '#FFFFFF',
            border: 'none', fontWeight: '700', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(5,150,105,0.30)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.background = '#047857'; e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.target.style.background = '#059669'; e.target.style.transform = 'translateY(0)'; }}
        >
          Portal Login →
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        padding: '90px 48px 70px',
        maxWidth: '1100px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '999px',
            background: '#DCFCE7', border: '1px solid #BBF7D0',
            fontSize: '12px', fontWeight: '800', color: '#15803D',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px'
          }}>
            <span style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />
            &nbsp;Live Platform — Rawalpindi / Islamabad
          </div>
          <h1 style={{
            fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: '900', lineHeight: '1.08',
            color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 20px'
          }}>
            Intelligent Waste<br />
            <span style={{
              background: 'linear-gradient(135deg, #059669, #10B981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Management OS</span>
          </h1>
          <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.7', margin: '0 0 36px', maxWidth: '460px' }}>
            A fully integrated smart bin network tracking waste collection, recycling, and carbon credit generation — built for Rawalpindi &amp; Islamabad.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 32px', borderRadius: '12px',
                background: '#059669', color: '#FFFFFF',
                border: 'none', fontWeight: '800', fontSize: '15px',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 28px rgba(5,150,105,0.45)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 6px 20px rgba(5,150,105,0.35)'; }}
            >
              Access Your Portal →
            </button>
            <a
              href="#live-stats"
              style={{
                padding: '14px 28px', borderRadius: '12px',
                background: '#FFFFFF', color: '#0F172A',
                border: '1.5px solid #E2E8F0', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
                transition: 'all 0.2s', display: 'inline-block'
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#059669'; e.target.style.color = '#059669'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.color = '#0F172A'; }}
            >
              View Live Stats ↓
            </a>
          </div>
        </div>

        {/* Hero Visual */}
        <div>
          <div style={{
            background: '#FFFFFF', borderRadius: '24px',
            border: '1px solid #E2E8F0', padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              System Flow
            </div>
            {[
              { icon: '📡', label: 'Proteus Smart Bin', sub: 'Ultrasonic + Gas sensors', color: '#EEF2FF', border: '#C7D2FE' },
              { icon: '🔗', label: 'IoT Bridge Script', sub: 'COM2 → UART → REST API', color: '#F0FDF4', border: '#BBF7D0' },
              { icon: '🗄️', label: 'GreenGold Backend', sub: 'MongoDB + Vercel Serverless', color: '#FFF7ED', border: '#FED7AA' },
              { icon: '♻️', label: 'Carbon Credits Minted', sub: 'Automatic on recycling report', color: '#F0FDF4', border: '#86EFAC' },
            ].map((step, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: step.color, border: `1.5px solid ${step.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0
                  }}>{step.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{step.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{step.sub}</div>
                  </div>
                </div>
                {i < 3 && (
                  <div style={{ paddingLeft: '21px', color: '#CBD5E1', fontSize: '18px', lineHeight: '1', marginBottom: '8px' }}>↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section id="live-stats" ref={statsRef} style={{
        background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
        padding: '80px 48px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '999px',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              fontSize: '12px', fontWeight: '800', color: '#15803D',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px'
            }}>
              <span style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} />
              &nbsp;Live from Database — Real Data Only
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Platform Impact at a Glance
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
              All numbers pulled live from GreenGold OS MongoDB — no estimates.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '15px' }}>
              Fetching live data...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '20px' }}>
              {[
                { value: bins, suffix: '', label: 'Active Smart Bins', sub: 'Deployed in the field', icon: '🗑️', valColor: '#4338CA', hoverBg: '#EEF2FF', hoverBorder: '#C7D2FE' },
                { value: clients, suffix: '', label: 'Client Sites', sub: 'Active service locations', icon: '🏢', valColor: '#EA580C', hoverBg: '#FFF7ED', hoverBorder: '#FED7AA' },
                { value: cc, suffix: ' CC', label: 'Carbon Credits', sub: 'Minted on registry', icon: '🌍', valColor: '#15803D', hoverBg: '#F0FDF4', hoverBorder: '#BBF7D0' },
                { value: wasteKg, suffix: ' kg', label: 'Waste Recycled', sub: 'Total across all streams', icon: '♻️', valColor: '#059669', hoverBg: '#F0FDF4', hoverBorder: '#86EFAC' },
                { value: pickups, suffix: '', label: 'Pickups Done', sub: 'Waste collection trips', icon: '🚛', valColor: '#B45309', hoverBg: '#FEF3C7', hoverBorder: '#FDE68A' },
                { value: batches, suffix: '', label: 'Recycling Batches', sub: 'Processed at facilities', icon: '🏭', valColor: '#0369A1', hoverBg: '#F0F9FF', hoverBorder: '#BAE6FD' },
              ].map((stat, i) => (
                <div key={i}
                  style={{ background: '#FAFAFA', border: '1.5px solid #E2E8F0', borderRadius: '20px', padding: '26px 22px', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = stat.hoverBg;
                    e.currentTarget.style.borderColor = stat.hoverBorder;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '26px', marginBottom: '12px' }}>{stat.icon}</div>
                  <div style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: '900', color: stat.valColor, lineHeight: 1, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                    {stat.value.toLocaleString()}{stat.suffix}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{stat.label}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '34px', fontWeight: '900', color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            End-to-End Waste Intelligence
          </h2>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>From sensor to carbon credit — fully automated.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px' }}>
          {[
            { step: '01', icon: '📡', title: 'Proteus Smart Bin', desc: 'Ultrasonic + gas sensors transmit fill level, weight & air quality via UART every 3 seconds.', hoverBg: '#EEF2FF', accent: '#4338CA' },
            { step: '02', icon: '⚡', title: 'Automatic Dispatch', desc: 'When a bin hits 86%+ fill, the OS auto-generates a waste collection ticket for the nearest collector.', hoverBg: '#FFF7ED', accent: '#EA580C' },
            { step: '03', icon: '🚚', title: 'Collector Routing', desc: 'Collectors see live pickup assignments and mark collections in real time on their mobile portal.', hoverBg: '#F0FDF4', accent: '#15803D' },
            { step: '04', icon: '🏭', title: 'Recycling & Minting', desc: 'Waste goes to partner plants. Carbon credits are calculated and minted automatically on the registry.', hoverBg: '#F0F9FF', accent: '#0369A1' },
          ].map((item, i) => (
            <div key={i}
              style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '26px 22px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = item.hoverBg; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '30px' }}>{item.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: item.accent, background: item.hoverBg, padding: '3px 8px', borderRadius: '6px' }}>{item.step}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PORTALS */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              7 Role-Based Portals
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>Every stakeholder in the waste value chain has a dedicated portal.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '14px' }}>
            {[
              { icon: '🏛️', role: 'Management Hub', desc: 'Approve requests, logistics, carbon registry' },
              { icon: '🏢', role: 'Customer Portal', desc: 'Submit bin requests & view impact' },
              { icon: '🔧', role: 'Technician', desc: 'Install & maintain smart bins' },
              { icon: '🚛', role: 'Collector Driver', desc: 'Pickup assignments & collection tracking' },
              { icon: '🏗️', role: 'Dump Facility', desc: 'Log & separate incoming waste batches' },
              { icon: '🚚', role: 'Transporter', desc: 'Haul waste to recycling plants' },
              { icon: '♻️', role: 'Recycling Plant', desc: 'Process batches & generate carbon reports' },
            ].map((p, i) => (
              <div key={i}
                style={{ padding: '20px 16px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#FAFAFA', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(5,150,105,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{p.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '5px' }}>{p.role}</div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '18px' }}>🌿</div>
          <h2 style={{ fontSize: '34px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Ready to Access Your Portal?
          </h2>
          <p style={{ fontSize: '16px', color: '#A7F3D0', lineHeight: '1.7', margin: '0 0 34px' }}>
            Log in with your credentials to access your role-specific dashboard and contribute to a circular waste economy.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '16px 44px', borderRadius: '14px',
              background: '#FFFFFF', color: '#065F46',
              border: 'none', fontWeight: '900', fontSize: '16px',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 14px 36px rgba(0,0,0,0.28)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
          >
            Login to GreenGold OS →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GreenGoldLogo size={30} subtitle="" />
          <span style={{ fontSize: '13px' }}>GreenGold OS — Smart Waste Management Platform</span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          Rawalpindi &amp; Islamabad · IoT + MongoDB + React
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
          footer { padding: 24px 20px !important; flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
