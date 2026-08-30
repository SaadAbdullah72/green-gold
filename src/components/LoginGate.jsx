import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBrandLogo } from './Icons';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRoleProfileChange = (newRole) => {
    setSelectedRoleProfile(newRole);
    setError('');
    setSuccessMsg('');

    if (newRole === 'MANAGEMENT') {
      setIsRegister(false);
      setEmail('saad489254@gmail.com');
      setPassword('saad123');
    } else if (newRole === 'COLLECTOR') {
      setIsRegister(false);
      setEmail('collector@greengold.com');
      setPassword('collector123');
    } else if (newRole === 'TRANSPORTER') {
      setIsRegister(false);
      setEmail('transporter1@greengold.com');
      setPassword('transport123');
    } else if (newRole === 'RECYCLING_PLANT') {
      setIsRegister(false);
      setEmail('pakrecycling@greengold.com');
      setPassword('plant123');
    } else if (newRole === 'DUMP_FACILITY') {
      setIsRegister(false);
      setEmail('dumpyard@greengold.com');
      setPassword('dump123');
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
        } else if (selectedRoleProfile === 'COLLECTOR') {
          data = await api.auth.registerCollector({
            fullName,
            email,
            phone,
            secondaryPhone,
            password,
            vehicleNumber: 'ICT-GRN-9912',
            zone: town || 'F-7'
          });
        } else if (selectedRoleProfile === 'TRANSPORTER') {
          data = await api.auth.registerTransporter({
            fullName,
            email,
            phone,
            secondaryPhone,
            password,
            vehicleNumber: 'ICT-TRN-1001'
          });
        } else if (selectedRoleProfile === 'RECYCLING_PLANT') {
          data = await api.auth.registerRecyclingPlant({
            organizationName: organizationName || fullName,
            fullName,
            email,
            phone,
            password,
            address: address || 'Sector I-9/2 Industrial Area, Islamabad',
            plantType: 'Organic/Compost',
            plantCapacityTons: 60
          });
        }
      } else {
        data = await api.auth.login(email, password);
      }

      if (data && data.user) {
        const normalizedRole = data.user.role === 'MANAGEMENT'
          ? 'ROLE_ADMIN'
          : data.user.role === 'TECHNICAL'
            ? 'ROLE_TECHNICIAN'
            : data.user.role === 'USER'
              ? 'ROLE_GENERATOR'
              : data.user.role === 'COLLECTOR'
                ? 'ROLE_COLLECTOR'
                : data.user.role === 'TRANSPORTER'
                  ? 'ROLE_TRANSPORTER'
                  : data.user.role === 'RECYCLING_PLANT'
                    ? 'ROLE_RECYCLING_PLANT'
                    : data.user.role === 'DUMP_FACILITY'
                      ? 'ROLE_DUMP_FACILITY'
                      : 'ROLE_GENERATOR';

        login({ ...data.user, role: normalizedRole }, data.token);

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        } else if (onLogin) {
          onLogin(normalizedRole, data.user);
        }

        const routeMap = {
          ROLE_ADMIN: '/management',
          ROLE_GENERATOR: '/generator',
          ROLE_TECHNICIAN: '/technician',
          ROLE_COLLECTOR: '/collector',
          ROLE_TRANSPORTER: '/transporter',
          ROLE_RECYCLING_PLANT: '/recycling-plant',
          ROLE_DUMP_FACILITY: '/dump-facility'
        };
        navigate(routeMap[normalizedRole] || '/generator');
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
            <img src="/logo.png" alt="GreenGold Logo" style={{ width: '260px', height: '260px', objectFit: 'contain', filter: 'drop-shadow(0 10px 30px rgba(16, 185, 129, 0.3))' }} />
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

          {/* QUICK ROLE SELECTOR BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('MANAGEMENT')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'MANAGEMENT' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'MANAGEMENT' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'MANAGEMENT' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Management
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('USER')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'USER' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'USER' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'USER' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('COLLECTOR')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'COLLECTOR' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'COLLECTOR' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'COLLECTOR' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Collector
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('TRANSPORTER')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'TRANSPORTER' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'TRANSPORTER' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'TRANSPORTER' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Transporter
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('RECYCLING_PLANT')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'RECYCLING_PLANT' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'RECYCLING_PLANT' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'RECYCLING_PLANT' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Recycling Plant
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('DUMP_FACILITY')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'DUMP_FACILITY' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'DUMP_FACILITY' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'DUMP_FACILITY' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Dump Yard
            </button>
            <button
              type="button"
              onClick={() => handleRoleProfileChange('TECHNICAL')}
              style={{
                padding: '9px 6px',
                borderRadius: '8px',
                border: selectedRoleProfile === 'TECHNICAL' ? '2px solid #047857' : '1px solid #CBD5E1',
                background: selectedRoleProfile === 'TECHNICAL' ? '#ECFDF5' : '#F8FAFC',
                color: selectedRoleProfile === 'TECHNICAL' ? '#047857' : '#334155',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Technician
            </button>
          </div>

          {/* ROLE PROFILE SELECTION DROPDOWN */}
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
              <option value="COLLECTOR">Waste Collector Driver</option>
              <option value="TRANSPORTER">Logistics & Inter-Facility Transporter</option>
              <option value="RECYCLING_PLANT">Industrial Recycling & Recovery Plant</option>
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

          {(selectedRoleProfile === 'MANAGEMENT' || selectedRoleProfile === 'COLLECTOR' || selectedRoleProfile === 'TRANSPORTER' || selectedRoleProfile === 'RECYCLING_PLANT') && !isRegister && (
            <div style={{ padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              {selectedRoleProfile === 'MANAGEMENT' && <>Management Admin Account Loaded: <strong>saad489254@gmail.com</strong> / <strong>saad123</strong></>}
              {selectedRoleProfile === 'COLLECTOR' && <>Collector Demo Account Loaded: <strong>collector@greengold.com</strong> / <strong>collector123</strong></>}
              {selectedRoleProfile === 'TRANSPORTER' && <>Transporter Demo Account Loaded: <strong>transporter1@greengold.com</strong> / <strong>transport123</strong></>}
              {selectedRoleProfile === 'RECYCLING_PLANT' && <>Recycling Plant Demo Account Loaded: <strong>pakrecycling@greengold.com</strong> / <strong>plant123</strong></>}
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
