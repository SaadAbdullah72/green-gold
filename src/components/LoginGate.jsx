import React, { useState } from 'react';

export default function LoginGate({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('management');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <div className="login-gate">
      <div className="glass-panel login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" stroke="url(#gold-grad)" strokeLinecap="round"/>
              <path d="M12 12c0-3-2-5-5-5c-2 0-3 2-1 4c3 3 6 1 6 1z" fill="var(--primary)"/>
              <path d="M12 12c0 3 2 5 5 5c2 0 3-2 1-4c-3-3-6-1-6-1z" fill="var(--gold-light)"/>
              <defs>
                <linearGradient id="gold-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>GreenGoldOS Gateway</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Smart waste, compost, and carbon operating system
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label htmlFor="role-select">Select Access Portal Profile</label>
            <select
              id="role-select"
              className="login-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: '100%', background: 'rgba(0, 0, 0, 0.45)', cursor: 'pointer' }}
            >
              <option value="management">Management Console (System Admin)</option>
              <option value="generator">Waste Generator (Hotel Marriott, etc.)</option>
              <option value="installer">Technical Bins Staff (Field Crew)</option>
              <option value="collector">Waste Collector Staff (Driver/Logistics)</option>
              <option value="composition">Waste Composition Firm (Processing Plant)</option>
            </select>
          </div>
          <button type="submit" className="login-btn">
            Access System Portal
          </button>
        </form>

        <p style={{ fontSize: '11px', color: 'var(--text-dark)', marginTop: '20px', textAlign: 'center' }}>
          By logging in, you accept the GreenGold circular governance protocol terms.
        </p>
      </div>
    </div>
  );
}
