import React, { useState } from 'react';
import { IconBrandLogo } from './Icons';
import { api } from '../api';

export default function LoginGate({ onLogin, onLoginSuccess }) {
  const [selectedRoleProfile, setSelectedRoleProfile] = useState('USER'); // 'MANAGEMENT', 'USER', 'TECHNICAL'
  const [isRegister, setIsRegister] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [town, setTown] = useState('F-7');
  const [address, setAddress] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Field Operations');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleProfileChange = (newRole) => {
    setSelectedRoleProfile(newRole);
    setError('');
    setSuccessMsg('');

    if (newRole === 'MANAGEMENT') {
      setIsRegister(false);
      setEmail('saad489254@gmail.com');
      setPassword('saad123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleTabChange = (registerMode) => {
    if (selectedRoleProfile === 'MANAGEMENT' && registerMode) {
      setError('Management accounts are pre-provisioned by system administrators. Please select Login.');
      return;
    }
    setIsRegister(registerMode);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      let data;
      if (isRegister) {
        if (selectedRoleProfile === 'USER') {
          data = await api.auth.registerUser({
            fullName,
            email,
            phone,
            password,
            organizationName: organizationName || fullName,
            address: address || 'Islamabad',
            town: town || 'F-7',
            city: 'Islamabad'
          });
        } else if (selectedRoleProfile === 'TECHNICAL') {
          data = await api.auth.registerTechnical({
            fullName,
            email,
            phone,
            secondaryPhone,
            password
          });
        }
      } else {
        data = await api.auth.login(email, password, selectedRoleProfile);
      }

      if (data && data.user) {
        let mappedRole = 'generator';
        if (data.user.role === 'MANAGEMENT') mappedRole = 'management';
        if (data.user.role === 'TECHNICAL') mappedRole = 'collector';

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        } else {
          onLogin(mappedRole);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('already registered')) {
        setError("This email is already registered in MongoDB. Please click the 'Login' tab above to sign in with your password.");
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-gate-wrapper" style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#F8FAFC', overflow: 'hidden', margin: 0, padding: 0 }}>
      
      {/* LEFT HAND HERO SIDEBAR (Clean Carbon-Free Environment Banner) */}
      <div 
        style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)', 
          padding: '60px 48px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative'
        }}
        className="login-hero-sidebar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 'auto', flex: 1 }}>
          {/* Prominent Main Logo */}
          <div style={{ marginBottom: '-10px', display: 'inline-flex' }}>
            <img src="/logo.png" alt="GreenGold Logo" style={{ width: '280px', height: '280px', objectFit: 'contain', mixBlendMode: 'screen', borderRadius: '24px', filter: 'brightness(1.1) drop-shadow(0 0 30px rgba(52, 211, 153, 0.4))' }} />
          </div>
          <div style={{ fontSize: '13px', color: '#34D399', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px' }}>
            CIRCULAR BIO-ECONOMY SYSTEM
          </div>

          <div style={{ maxWidth: '420px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', lineHeight: '1.3', marginBottom: '16px', color: '#F0FDF4' }}>
              Building a Sustainable, Carbon-Free Environment
            </h2>
            <p style={{ fontSize: '15px', color: '#A7F3D0', lineHeight: '1.7', margin: 0, fontWeight: '400' }}>
              Empowering communities, businesses, and cities with intelligent smart bin deployment, organic waste recycling, and zero-emissions resource recovery.
            </p>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#059669', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', paddingTop: '20px' }}>
          GreenGold OS Circular Governance © 2026. All Rights Reserved.
        </div>
      </div>

      {/* RIGHT HAND AUTH FORM CONTAINER */}
      <div 
        className="login-auth-container"
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'center', 
          padding: '40px', 
          background: '#FFFFFF',
          maxWidth: '640px',
          overflowY: 'auto'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {isRegister ? 'Sign Up Account' : 'Portal Login'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Select your access profile role and authenticate below.
            </p>
          </div>

          {/* ROLE PROFILE SELECTION DROPDOWN (Clean, No Emojis) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Access Profile Role *
            </label>
            <select
              className="modern-input"
              value={selectedRoleProfile}
              onChange={(e) => handleRoleProfileChange(e.target.value)}
              style={{ width: '100%', height: '48px', fontWeight: '700', fontSize: '14px', borderRadius: '10px', borderColor: '#CBD5E1' }}
            >
              <option value="MANAGEMENT">Management Operations</option>
              <option value="USER">Customer / Waste Generator</option>
              <option value="TECHNICAL">Technical Workforce Crew</option>
            </select>
          </div>

          {/* LOGIN vs SIGN UP TABS */}
          <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
            <button
              type="button"
              style={{
                flex: 1, padding: '12px', fontSize: '15px', fontWeight: '800', border: 'none', background: 'none',
                borderBottom: !isRegister ? '3px solid #10B981' : '3px solid transparent',
                color: !isRegister ? '#047857' : '#64748B', cursor: 'pointer'
              }}
              onClick={() => handleTabChange(false)}
            >
              Login
            </button>
            <button
              type="button"
              style={{
                flex: 1, padding: '12px', fontSize: '15px', fontWeight: '800', border: 'none', background: 'none',
                borderBottom: isRegister ? '3px solid #10B981' : '3px solid transparent',
                color: isRegister ? '#047857' : '#64748B', cursor: 'pointer',
                opacity: selectedRoleProfile === 'MANAGEMENT' ? 0.35 : 1
              }}
              onClick={() => handleTabChange(true)}
            >
              Sign Up
            </button>
          </div>

          {/* ERROR / SUCCESS MESSAGES */}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              {successMsg}
            </div>
          )}

          {selectedRoleProfile === 'MANAGEMENT' && !isRegister && (
            <div style={{ padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              Management Admin Account Credentials Loaded: <strong>saad489254@gmail.com</strong> / <strong>saad123</strong>
            </div>
          )}

          {/* AUTH FORM */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="e.g. Zeeshan Haider"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', height: '44px' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                className="modern-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                style={{ width: '100%', height: '44px' }}
              />
            </div>

            {isRegister && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  className="modern-input"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ width: '100%', height: '44px' }}
                />
              </div>
            )}

            {isRegister && selectedRoleProfile === 'USER' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Organization / Hotel Name
                  </label>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="e.g. Hotel Marriott Islamabad"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    style={{ width: '100%', height: '44px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Town
                    </label>
                    <input
                      type="text"
                      className="modern-input"
                      placeholder="e.g. F-7"
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      style={{ width: '100%', height: '44px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="modern-input"
                      placeholder="e.g. Plot 5, Sector F-7/2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{ width: '100%', height: '44px' }}
                    />
                  </div>
                </div>
              </>
            )}

            {isRegister && selectedRoleProfile === 'TECHNICAL' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Secondary Emergency Phone Number *
                </label>
                <input
                  type="tel"
                  className="modern-input"
                  placeholder="e.g. +92 321 9998877"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  required
                  style={{ width: '100%', height: '44px' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Password *
              </label>
              <input
                type="password"
                className="modern-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ width: '100%', height: '44px' }}
              />
            </div>

            <button
              type="submit"
              className="btn-eco-primary"
              disabled={loading}
              style={{ width: '100%', height: '48px', fontSize: '15px', justifyContent: 'center', fontWeight: '800', borderRadius: '10px' }}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Sign Up & Continue »' : 'Login to Portal »'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
