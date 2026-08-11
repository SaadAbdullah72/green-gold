import React from 'react';
import { IconBrandLogo, IconLeaf, IconBox, IconShield } from './Icons';

export default function CompostOperatorDashboard({ username = "Compost Operator", onLogout }) {
  return (
    <div style={{ background: 'var(--header-dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="soft-card" style={{ maxWidth: '680px', width: '100%', padding: '48px', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IconBrandLogo size={44} />
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Thermophilic Compost Yard Control
              </h2>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Ecofine Bio-Process Controller
              </div>
            </div>
          </div>
          <span className="pill-badge" style={{ background: '#EBF7EE', color: '#146C2E' }}>
            🟢 Aeration Digestion Online
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>66°C</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Pile Temp (Optimum)</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>28:1</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>C:N Ratio Recipe</div>
          </div>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>58%</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Moisture Level</div>
          </div>
        </div>

        <div style={{ background: 'var(--header-dark)', color: '#FFFFFF', padding: '24px', borderRadius: '18px', marginBottom: '32px' }}>
          <h4 style={{ color: 'var(--accent-green)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', marginBottom: '12px' }}>
            COMPOST OPERATOR CAPABILITIES
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#CBD5E1' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Carbon-to-Nitrogen ratio recipe calculator and moisture balance
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Automated pile turning schedule triggers & thermophilic sensors
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>✓</span> Harvesting triggers to shift mature compost from digestion to curing bays
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
