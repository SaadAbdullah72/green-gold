import React from 'react';
import { IconBrandLogo, IconTruck, IconBox, IconShield } from './Icons';

export default function LogisticsDashboard({ username = "Driver E-04", onLogout }) {
  return (
    <div style={{ background: 'var(--header-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="soft-card" style={{ maxWidth: '680px', width: '100%', padding: '48px', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IconBrandLogo size={44} />
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Logistics & Fleet Command
              </h2>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Ecofine Telemetry Module
              </div>
            </div>
          </div>
          <span className="pill-badge" style={{ background: '#EBF7EE', color: '#146C2E' }}>
            🟢 Fleet Telemetry Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>12</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Routes Optimized</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>1,850 kg</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Today's Haulage</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>99.4%</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>On-Time Dispatch</div>
          </div>
        </div>

        <div style={{ background: 'var(--header-dark)', color: '#FFFFFF', padding: '24px', borderRadius: '18px', marginBottom: '32px' }}>
          <h4 style={{ color: 'var(--accent-green)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', marginBottom: '12px' }}>
            LOGISTICS TELEMETRY SPECIFICATIONS
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#CBD5E1' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Real-time GPS vehicle route optimization & auto-dispatch
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Digital scale weighbridge integration for organic payload tracking
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Automated contamination flag reports and picture evidence uploads
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onLogout} className="btn-eco-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Return to Login Gateway »
          </button>
        </div>
      </div>
    </div>
  );
}
