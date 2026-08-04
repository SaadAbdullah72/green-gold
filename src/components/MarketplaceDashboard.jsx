import React from 'react';

export default function MarketplaceDashboard({ onLogout }) {
  return (
    <div className="login-gate" style={{ backgroundImage: "url('/green_gold_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="glass-panel placeholder-view" style={{ maxWidth: '600px', padding: '50px', background: 'rgba(8, 16, 12, 0.85)', border: '1px solid var(--border-highlight)' }}>
        <div className="placeholder-icon-box" style={{ width: '80px', height: '80px', background: 'rgba(251, 191, 36, 0.08)', borderColor: 'var(--border-highlight)' }}>
          <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--gold-light)" strokeWidth="1.5" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        
        <h3 style={{ fontSize: '26px', color: 'var(--gold-light)', fontWeight: '800', marginBottom: '10px' }}>
          404 - Marketplace Buyer Portal
        </h3>
        
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          The B2B circular marketplace directory, product catalogs, and checkout portals are currently under development.
        </p>

        <div className="scope-box" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', textAlign: 'left' }}>
          <h4 style={{ color: 'var(--secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '10px' }}>
            Next Developer Implementation Guide
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '10px' }}>
            Fill this component file with the Marketplace UI:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Connect to GET <code>/api/marketplace/items</code> to load certified stock.</li>
            <li>Implement the cart order checkout with payment gateways integration.</li>
            <li>Build the batch provenance tree showing the waste ingredients.</li>
            <li>Develop customer carbon offsetting ledger claims.</li>
          </ul>
        </div>

        <button 
          onClick={onLogout}
          className="guest-bypass-btn" 
          style={{ width: '100%', border: '1px solid var(--gold-light)', color: 'var(--gold-light)', marginTop: '25px' }}
        >
          Return to Login Gateway
        </button>
      </div>
    </div>
  );
}
