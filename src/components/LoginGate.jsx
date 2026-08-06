import React, { useState } from 'react';
import { IconBrandLogo } from './Icons';

export default function LoginGate({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('management');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: 'var(--bg-app)' }}>
      <div className="soft-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
        
        {/* Brand Icon Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <IconBrandLogo size={64} />
        </div>


        <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          GreenGoldOS Portal
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Circular bio-waste, compost & carbon intelligence platform
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label 
              htmlFor="role-select" 
              style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
            >
              Select Access Profile
            </label>
            <select
              id="role-select"
              className="modern-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ cursor: 'pointer', height: '52px' }}
            >
              <option value="management">Management Console (System Admin)</option>
              <option value="generator">Waste Generator (Hotel Marriott, etc.)</option>
              <option value="installer">Technical Bins Staff (Field Crew)</option>
              <option value="collector">Waste Collector Staff (Driver/Logistics)</option>
              <option value="composition">Waste Composition Firm (Processing Plant)</option>
            </select>
          </div>

          <button type="submit" className="btn-emerald" style={{ width: '100%', height: '52px', fontSize: '15px' }}>
            Access System Portal ➔
          </button>
        </form>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
          By accessing the portal, you agree to the GreenGold circular governance protocol standards.
        </p>
      </div>
    </div>
  );
}
