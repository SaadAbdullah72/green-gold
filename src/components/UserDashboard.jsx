import React, { useState } from 'react';
import {
  IconDashboard, IconPlus, IconBin, IconTruck,
  IconLeaf, IconBell, IconUser, IconChart, IconShield, IconBox
} from './Icons';

export default function UserDashboard({ username, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Dynamic User Info
  const displayName = userData?.organizationName || userData?.fullName || username || 'Marriott Manager';
  const userCity = userData?.city || 'Islamabad Capital Territory';
  const userPhone = userData?.phone || '+92 300 1234567';
  const wasteEstimate = userData?.wasteEstimate || '20–50 kg';

  // Dynamic Bin Request Form State
  const [binRequestForm, setBinRequestForm] = useState({
    locationName: '',
    category: 'Commercial Unit',
    contactNumber: userPhone,
    fullAddress: '',
    binsNeeded: '1',
    binCategory: 'Organic Waste Bin',
    specialInstructions: ''
  });

  // Modal States
  const [showBinModal, setShowBinModal] = useState(false);
  const [showPickupFormModal, setShowPickupFormModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pickupReason, setPickupReason] = useState('Bin Full');
  const [pickupNotes, setPickupNotes] = useState('');

  // Sustainability & ESG Detailed View State
  const [esgDetailView, setEsgDetailView] = useState(null);

  // 3 Smart Bins Telemetry State
  const [smartBins] = useState([
    { id: 'BIN-SG-01', location: 'Main Kitchen', status: 'Full / Ready for Pickup', fillPercent: 100, airQuality: 'Poor (High VOCs)', moisture: '68%', odor: '42%' },
    { id: 'BIN-SG-02', location: 'Cafeteria Floor', status: 'Active (Online)', fillPercent: 45, airQuality: 'Good', moisture: '34%', odor: '12%' },
    { id: 'BIN-SG-03', location: 'Banquet Hall Prep', status: 'Active (Online)', fillPercent: 62, airQuality: 'Moderate', moisture: '48%', odor: '22%' },
  ]);

  // Active Pickup Requests & History Combined
  const [pickupRequests] = useState([
    {
      requestId: 'REQ-9941',
      date: '2026-08-05',
      reason: 'Bin Full (BIN-SG-01)',
      status: 'Vehicle On The Way',
      currentStepIndex: 2,
      collectorName: 'Muhammad Ali',
      vehicleNumber: 'ICT-GRN-9912',
      eta: '18 mins',
      weight: '42 kg',
      notes: 'Urgent pickup needed before evening banquet.'
    },
    {
      requestId: 'REQ-8820',
      date: '2026-08-03',
      reason: 'Bad Odor / VOC Spike',
      status: 'Processing Started',
      currentStepIndex: 6,
      collectorName: 'Tariq Mehmood',
      vehicleNumber: 'ICT-GRN-4421',
      eta: 'Completed',
      weight: '28 kg',
      notes: 'Coffee grounds fermentation managed.'
    },
    {
      requestId: 'REQ-7612',
      date: '2026-07-29',
      reason: 'Emergency Overflow Risk',
      status: 'Delivered to Compost Plant',
      currentStepIndex: 5,
      collectorName: 'Aslam Khan',
      vehicleNumber: 'ICT-GRN-1109',
      eta: 'Completed',
      weight: '55 kg',
      notes: 'Standard scheduled full bin clearance.'
    }
  ]);

  const trackingSteps = [
    'Request Submitted',
    'Collector Assigned',
    'Vehicle On The Way',
    'Arrived',
    'Waste Collected',
    'Delivered to Compost Plant',
    'Processing Started'
  ];

  // Sidebar Menu Structure
  const menuSections = [
    {
      title: "DASHBOARD & OVERVIEW",
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: <IconDashboard size={22} /> },
      ]
    },
    {
      title: "BIN MANAGEMENT",
      items: [
        { id: 'request_bin', label: 'Request Smart Bin', icon: <IconPlus size={22} /> },
        { id: 'bins', label: 'My Bins Status', icon: <IconBin size={22} /> },
      ]
    },
    {
      title: "PICKUP & LOGISTICS",
      items: [
        { id: 'filled_bin_pickup', label: 'Filled Bin Pickup Request', icon: <IconTruck size={22} /> },
      ]
    },
    {
      title: "SUSTAINABILITY & ESG",
      items: [
        { id: 'sustainability_esg', label: 'Sustainability & ESG', icon: <IconLeaf size={22} /> },
      ]
    },
    {
      title: "ACCOUNT & SETTINGS",
      items: [
        { id: 'notifications', label: 'Notifications', icon: <IconBell size={22} /> },
        { id: 'profile', label: 'Profile & Settings', icon: <IconUser size={22} /> },
      ]
    }
  ];


  const handlePickupFormSubmit = (e) => {
    e.preventDefault();
    setShowPickupFormModal(false);
    setPickupNotes('');
    setShowApprovalModal(true);
  };

  const handleBinRequestSubmit = (e) => {
    e.preventDefault();
    const newManagementRequest = {
      requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      locationName: binRequestForm.locationName,
      category: binRequestForm.category,
      contactNumber: binRequestForm.contactNumber,
      fullAddress: binRequestForm.fullAddress,
      binsNeeded: binRequestForm.binsNeeded,
      binCategory: binRequestForm.binCategory,
      notes: binRequestForm.specialInstructions,
      status: 'Pending Management Review',
      timestamp: new Date().toLocaleString()
    };
    const existingRequests = JSON.parse(localStorage.getItem('management_bin_requests') || '[]');
    localStorage.setItem('management_bin_requests', JSON.stringify([newManagementRequest, ...existingRequests]));
    setShowBinModal(true);
    setBinRequestForm({
      locationName: '',
      category: 'Commercial Unit',
      contactNumber: userPhone,
      fullAddress: '',
      binsNeeded: '1',
      binCategory: 'Organic Waste Bin',
      specialInstructions: ''
    });
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* MANAGEMENT APPROVAL POPUP MODAL */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #091a12 0%, #050f0a 100%)',
            border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '16px',
            padding: '30px', maxWidth: '450px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', textAlign: 'center'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)', color: '#facc15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              margin: '0 auto 16px auto', border: '1px solid #facc15'
            }}>
              ⏳
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff', fontWeight: '700' }}>
              Request is passed to management, wait for approval
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
              Your pickup request has been successfully registered and sent to management for review.
            </p>
            <button onClick={() => setShowApprovalModal(false)} className="login-btn" style={{ width: '100%', padding: '12px' }}>
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

      {/* PICKUP REQUEST FORM MODAL */}
      {showPickupFormModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #091a12 0%, #050f0a 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px',
            padding: '30px', maxWidth: '500px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '18px' }}>🚛 Filled Bin Pickup Request Form</h3>
              <button onClick={() => setShowPickupFormModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handlePickupFormSubmit}>
              <div className="login-form-group">
                <label>Pickup Reason</label>
                <select value={pickupReason} onChange={(e) => setPickupReason(e.target.value)} className="login-input">
                  <option value="Bin Full" style={{ background: '#08100c' }}>Bin Full (100% Capacity)</option>
                  <option value="Bad Odor" style={{ background: '#08100c' }}>Bad Odor / VOC Spike</option>
                  <option value="Emergency" style={{ background: '#08100c' }}>Emergency Overflow Risk</option>
                  <option value="Other" style={{ background: '#08100c' }}>Other Scheduled Reason</option>
                </select>
              </div>
              <div className="login-form-group">
                <label>Notes (Optional)</label>
                <textarea rows="3" placeholder="Add specific gate entry or timing notes..." value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} className="login-input" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="login-btn" style={{ flex: 1, margin: 0 }}>Submit Pickup Request</button>
                <button type="button" onClick={() => setShowPickupFormModal(false)} className="guest-bypass-btn" style={{ margin: 0 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BIN ALLOTMENT POPUP MODAL */}
      {showBinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #091a12 0%, #050f0a 100%)',
            border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '16px',
            padding: '30px', maxWidth: '500px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)', textAlign: 'center'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold-light, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              margin: '0 auto 16px auto', border: '1px solid #fbbf24'
            }}>
              📩
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#fff', fontWeight: '700' }}>
              Request Sent to Management!
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
              A request is sent to Management. Your application is currently under review.
            </p>
            <button onClick={() => setShowBinModal(false)} className="login-btn" style={{ width: '100%', padding: '12px' }}>
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER / BRANDING & GREETING BAR */}
      <header style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="avatar-circle">
            {displayName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Good Morning</div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.02em' }}>{displayName}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="rewards-pill">
            🍃 1,257 Rewards
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' }}>
            🔔
          </div>
          <button
            onClick={onLogout}
            className="btn-outline"
            style={{ height: '40px', padding: '0 16px', fontSize: '13px', color: 'var(--error)', borderColor: '#FCA5A5' }}
          >
            Logout ➔
          </button>
        </div>
      </header>

      {/* BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, width: '100%', boxSizing: 'border-box' }}>

        {/* LEFT SIDEBAR */}
        <aside style={{
          width: '270px', background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)', padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto',
          maxHeight: 'calc(100vh - 73px)', position: 'sticky', top: '73px'
        }}>
          {menuSections.map((sec, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', paddingLeft: '12px', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sec.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setEsgDetailView(null); }}
                    className={`nav-tab-btn ${activeTab === item.id ? 'active' : ''}`}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>


        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>

          {/* 1. CLEAN & PROFESSIONAL DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

              {/* Welcome Banner */}
              <div className="soft-card" style={{ margin: 0, padding: '28px', background: '#FFFFFF', border: '1px solid var(--border-color)' }}>
                <span className="pill-badge" style={{ marginBottom: '12px' }}>GENERATOR PORTAL CONTROL DECK</span>
                <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: '6px 0 8px 0', fontWeight: '800' }}>Welcome back, {displayName}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '700px', lineHeight: '1.6' }}>
                  Monitor real-time waste diversion telemetry, manage smart bin requests, and access your sustainability metrics seamlessly through the quick category navigation hubs below.
                </p>
              </div>

              {/* Category Quick Navigation Hub (Professional Grid Layout) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>
                  📂 MAIN CATEGORY NAVIGATION
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                  {/* Category 1: Bin Management */}
                  <div className="soft-card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <span className="pill-badge" style={{ fontSize: '10px', marginBottom: '8px' }}>BIN MANAGEMENT</span>
                      <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Smart Bins & Allotments</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Request new IoT waste bins or monitor real-time fill capacities and sensor metrics.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setActiveTab('request_bin')}
                        className="btn-emerald"
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                      >
                        Request Smart Bin ➔
                      </button>
                      <button
                        onClick={() => setActiveTab('bins')}
                        className="btn-outline"
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                      >
                        My Bins Status ➔
                      </button>
                    </div>
                  </div>

                  {/* Category 2: Pickup & Logistics */}
                  <div className="soft-card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <span className="pill-badge" style={{ fontSize: '10px', marginBottom: '8px' }}>PICKUP & LOGISTICS</span>
                      <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Dispatches & Live Tracking</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Initiate filled bin pickup requests and track assigned transport vehicles in real-time.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('filled_bin_pickup')}
                      className="btn-emerald"
                      style={{ width: '100%', margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                    >
                      Open Pickup & Logistics Hub ➔
                    </button>
                  </div>

                  {/* Category 3: Sustainability & ESG */}
                  <div className="soft-card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <span className="pill-badge" style={{ fontSize: '10px', marginBottom: '8px' }}>SUSTAINABILITY & ESG</span>
                      <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Carbon & Impact Reports</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Inspect verified carbon credits, waste diversion totals, ESG ratings, and audit certificates.</p>
                    </div>
                    <button
                      onClick={() => { setActiveTab('sustainability_esg'); setEsgDetailView(null); }}
                      className="btn-emerald"
                      style={{ width: '100%', margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                    >
                      Open ESG Hub ➔
                    </button>
                  </div>

                  {/* Category 4: Account & Settings */}
                  <div className="soft-card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <span className="pill-badge" style={{ fontSize: '10px', marginBottom: '8px' }}>ACCOUNT & SETTINGS</span>
                      <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Facility Profile & Alerts</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Manage organization credentials, contact details, and review system notifications.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="btn-outline"
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                      >
                        Notifications ➔
                      </button>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="btn-emerald"
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px', height: '40px' }}
                      >
                        Profile Settings ➔
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* 2. REQUEST SMART BIN */}
          {activeTab === 'request_bin' && (
            <div className="soft-card" style={{ margin: '0 auto', maxWidth: '700px', padding: '32px', background: '#FFFFFF' }}>
              <h3 style={{ marginTop: 0, marginBottom: '6px', fontSize: '22px', color: 'var(--text-primary)', textAlign: 'center', fontWeight: '800' }}>
                Request Smart Bin Allotment
              </h3>
              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Fill out the deployment details below to request additional IoT-enabled organic waste bins.
              </p>
              <form onSubmit={handleBinRequestSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Location / Department Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Kitchen, Floor 2"
                      value={binRequestForm.locationName}
                      onChange={(e) => setBinRequestForm({ ...binRequestForm, locationName: e.target.value })}
                      className="login-input"
                      style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Facility Category *</label>
                    <select
                      value={binRequestForm.category}
                      onChange={(e) => setBinRequestForm({ ...binRequestForm, category: e.target.value })}
                      className="login-input"
                      style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="Commercial Unit">Commercial / Plaza / Retail</option>
                      <option value="Restaurant / Cafe / Hotel">Restaurant / Cafe / Hotel</option>
                      <option value="Institutional / Cafeteria">Institutional / Cafeteria</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Contact Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={binRequestForm.contactNumber}
                      onChange={(e) => setBinRequestForm({ ...binRequestForm, contactNumber: e.target.value })}
                      className="login-input"
                      style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Bins Quantity Needed *</label>
                    <select
                      value={binRequestForm.binsNeeded}
                      onChange={(e) => setBinRequestForm({ ...binRequestForm, binsNeeded: e.target.value })}
                      className="login-input"
                      style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="1">1 Unit</option>
                      <option value="2">2 Units</option>
                      <option value="3">3 Units</option>
                      <option value="5">5+ Units</option>
                    </select>
                  </div>
                </div>

                <div className="login-form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Complete Street Address / Placement Instructions *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Enter precise street address, building block, or floor level..."
                    value={binRequestForm.fullAddress}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, fullAddress: e.target.value })}
                    className="login-input"
                    style={{ resize: 'vertical', background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="login-form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Special Deployment Notes (Optional)</label>
                  <textarea
                    rows="2"
                    placeholder="Mention specific sensor requirements or delivery timings..."
                    value={binRequestForm.specialInstructions}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, specialInstructions: e.target.value })}
                    className="login-input"
                    style={{ resize: 'vertical', background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <button type="submit" className="btn-emerald" style={{ width: '100%', height: '46px', fontSize: '14px' }}>
                  Submit Smart Bin Allotment Request ➔
                </button>
              </form>
            </div>
          )}

          {/* 3. MY BINS STATUS */}
          {activeTab === 'bins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="soft-card" style={{ padding: '20px 24px', margin: 0 }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>My Smart Bins Real-Time Telemetry</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {smartBins.map((bin, index) => (
                  <div key={index} className="soft-card" style={{ margin: 0, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>{bin.id}</h4>
                      <span className="pill-badge" style={{ background: bin.fillPercent === 100 ? '#FEE2E2' : '#ECFDF5', color: bin.fillPercent === 100 ? '#EF4444' : '#059669' }}>
                        {bin.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Location: <strong style={{ color: 'var(--text-primary)' }}>{bin.location}</strong></p>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Capacity Filled:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{bin.fillPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${bin.fillPercent}%`, height: '100%', background: bin.fillPercent === 100 ? '#EF4444' : '#10B981', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                      <div><span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Air Quality</span><strong style={{ fontSize: '12px', color: '#2563EB' }}>{bin.airQuality}</strong></div>
                      <div><span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Moisture</span><strong style={{ fontSize: '12px', color: '#059669' }}>{bin.moisture}</strong></div>
                      <div><span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Odor Level</span><strong style={{ fontSize: '12px', color: '#D97706' }}>{bin.odor}</strong></div>
                    </div>
                    {bin.fillPercent === 100 && (
                      <button onClick={() => setShowPickupFormModal(true)} className="btn-emerald" style={{ width: '100%', height: '40px', fontSize: '13px', background: '#EF4444', border: 'none' }}>
                        Request Filled Bin Pickup ➔
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. FILLED BIN PICKUP & LIVE TRACKING */}
          {activeTab === 'filled_bin_pickup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="soft-card" style={{ padding: '24px 28px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                    Filled Bin Pickup & Live Tracking
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                    Request dispatches for full bins and monitor active vehicle tracking below.
                  </p>
                </div>
                <div>
                  <button onClick={() => setShowPickupFormModal(true)} className="btn-emerald" style={{ height: '42px', padding: '0 20px', fontSize: '13px' }}>
                    + Request Pickup
                  </button>
                </div>
              </div>

              {/* Live Tracking Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: '800', margin: 0 }}>Active Dispatches & Tracking</h4>
                {pickupRequests.slice(0, 1).map((req, idx) => (
                  <div key={idx} className="soft-card" style={{ padding: '28px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                      <div>
                        <span className="pill-badge" style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>{req.requestId}</span>
                        <h4 style={{ margin: '6px 0 0 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Reason: {req.reason}</h4>
                      </div>
                      <span className="pill-badge" style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: '700', padding: '6px 14px' }}>{req.status}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div><span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Collector Name</span><strong style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{req.collectorName}</strong></div>
                      <div><span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Vehicle Number</span><strong style={{ fontSize: '14px', color: '#2563EB', fontWeight: '700' }}>{req.vehicleNumber}</strong></div>
                      <div><span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Estimated Arrival (ETA)</span><strong style={{ fontSize: '14px', color: '#059669', fontWeight: '700' }}>{req.eta}</strong></div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>Live Tracking Progress:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {trackingSteps.map((step, sIdx) => {
                        const isCompleted = sIdx <= req.currentStepIndex;
                        const isCurrent = sIdx === req.currentStepIndex;
                        return (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isCompleted ? (isCurrent ? '#F59E0B' : '#10B981') : '#F1F5F9', color: isCompleted ? '#FFFFFF' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                              {isCompleted ? '✓' : ''}
                            </div>
                            <span style={{ fontSize: '13.5px', color: isCurrent ? '#D97706' : (isCompleted ? 'var(--text-primary)' : '#94A3B8'), fontWeight: isCurrent ? '700' : (isCompleted ? '600' : '400') }}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Past Request History Archive Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: '800', margin: 0 }}>Past Pickup Request History Archive</h4>
                  <span className="pill-badge" style={{ background: '#ECFDF5', color: '#059669' }}>Total Diverted: 125 kg</span>
                </div>
                {pickupRequests.map((req, idx) => (
                  <div key={idx} className="soft-card" style={{ padding: '24px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="pill-badge" style={{ fontSize: '12px', fontWeight: '700' }}>
                          {req.requestId}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{req.reason}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                        📅 {req.date}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', fontSize: '13.5px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', display: 'block', marginBottom: '2px' }}>Assigned Collector</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{req.collectorName}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', display: 'block', marginBottom: '2px' }}>Vehicle Unit</span>
                        <span style={{ color: '#2563EB', fontWeight: '600' }}>{req.vehicleNumber}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', display: 'block', marginBottom: '2px' }}>Recorded Weight</span>
                        <span style={{ color: '#059669', fontWeight: '700' }}>{req.weight}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', display: 'block', marginBottom: '2px' }}>Final Status</span>
                        <span className="pill-badge" style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669' }}>● {req.status}</span>
                      </div>
                    </div>
                    {req.notes && (
                      <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', borderLeft: '3px solid #10B981', border: '1px solid var(--border-color)', borderLeftWidth: '3px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> {req.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 5. SUSTAINABILITY & ESG */}
          {activeTab === 'sustainability_esg' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {esgDetailView === null ? (
                <>
                  {/* Header Title & Intro */}
                  <div className="soft-card" style={{ padding: '24px 28px', margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <IconLeaf size={24} color="var(--primary)" />
                      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: '800' }}>Sustainability & ESG Hub</h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Track carbon credit measurement, transparency metrics, and grant eligibility through the core modules below. Click any card to open its dedicated view.
                    </p>
                  </div>

                  {/* 4 Interactive Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>

                    {/* Card 1: Carbon Footprint */}
                    <div
                      onClick={() => setEsgDetailView('carbon')}
                      className="soft-card"
                      style={{ margin: 0, padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                          <IconLeaf size={22} color="#059669" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>Carbon Footprint</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>View CO₂ emissions reduced and active carbon credits earned.</p>
                      </div>
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Open View ➔
                      </span>
                    </div>

                    {/* Card 2: Waste Impact */}
                    <div
                      onClick={() => setEsgDetailView('waste')}
                      className="soft-card"
                      style={{ margin: 0, padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                          <IconBin size={22} color="#059669" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>Waste Impact</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Monitor organic waste diverted and compost generated in kilograms.</p>
                      </div>
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Open View ➔
                      </span>
                    </div>

                    {/* Card 3: ESG Score */}
                    <div
                      onClick={() => setEsgDetailView('esg')}
                      className="soft-card"
                      style={{ margin: 0, padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                          <IconChart size={22} color="#2563EB" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>ESG Score</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Inspect overall ESG rating and calculated sustainability score.</p>
                      </div>
                      <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Open View ➔
                      </span>
                    </div>

                    {/* Card 4: Certificates & Reports */}
                    <div
                      onClick={() => setEsgDetailView('certificates')}
                      className="soft-card"
                      style={{ margin: 0, padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', border: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                          <IconShield size={22} color="#D97706" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800' }}>Certificates & Reports</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Access downloadable audit reports and verified digital certificates.</p>
                      </div>
                      <span style={{ fontSize: '13px', color: '#D97706', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Open View ➔
                      </span>
                    </div>

                  </div>
                </>
              ) : (
                /* Dedicated New Screen View with Professional Header Layout */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Top Bar with Corner Back Button and Centered Heading */}
                  <div className="soft-card" style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', alignItems: 'center', padding: '14px 20px', margin: 0 }}>
                    <button
                      onClick={() => setEsgDetailView(null)}
                      className="btn-outline"
                      style={{
                        margin: 0,
                        padding: '4px 12px',
                        fontSize: '12px',
                        height: '34px',
                        justifySelf: 'start'
                      }}
                    >
                      ← Back
                    </button>

                    <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', fontWeight: '800', textAlign: 'center', justifySelf: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {esgDetailView === 'carbon' && <><IconLeaf size={20} color="#059669" /> Carbon Footprint</>}
                      {esgDetailView === 'waste' && <><IconBin size={20} color="#059669" /> Waste Impact</>}
                      {esgDetailView === 'esg' && <><IconChart size={20} color="#2563EB" /> ESG Score</>}
                      {esgDetailView === 'certificates' && <><IconShield size={20} color="#D97706" /> Certificates & Reports</>}
                    </h3>

                    <div></div>
                  </div>

                  {/* Screen Content: Carbon Footprint */}
                  {esgDetailView === 'carbon' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px' }}>CO₂ EMISSIONS REDUCED</span>
                        <h2 style={{ fontSize: '38px', color: '#059669', margin: '10px 0 6px 0', fontWeight: '800' }}>0.85 MT</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>Verified greenhouse gas reductions certified through automated organic waste routing.</p>
                      </div>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px', background: '#FEF3C7', color: '#D97706' }}>CARBON CREDITS EARNED</span>
                        <h2 style={{ fontSize: '38px', color: '#D97706', margin: '10px 0 6px 0', fontWeight: '800' }}>12.4 Credits</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>Eligible for corporate sustainability grants and carbon offset monetization.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: Waste Impact */}
                  {esgDetailView === 'waste' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px' }}>TOTAL ORGANIC WASTE DIVERTED (KG)</span>
                        <h2 style={{ fontSize: '38px', color: '#059669', margin: '10px 0 6px 0', fontWeight: '800' }}>1,420 kg</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>Total kitchen and food waste successfully diverted from municipal landfills.</p>
                      </div>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px', background: '#FEF3C7', color: '#D97706' }}>COMPOST GENERATED (KG)</span>
                        <h2 style={{ fontSize: '38px', color: '#D97706', margin: '10px 0 6px 0', fontWeight: '800' }}>710 kg</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>High-grade nutrient fertilizer output produced for regional agriculture.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: ESG Score */}
                  {esgDetailView === 'esg' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px' }}>OVERALL ESG RATING</span>
                        <h2 style={{ fontSize: '38px', color: '#059669', margin: '10px 0 6px 0', fontWeight: '800' }}>Grade A</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>Top-tier corporate compliance rating for environmental excellence.</p>
                      </div>
                      <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                        <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px', background: '#EFF6FF', color: '#2563EB' }}>SUSTAINABILITY SCORE</span>
                        <h2 style={{ fontSize: '38px', color: '#2563EB', margin: '10px 0 6px 0', fontWeight: '800' }}>94.2 / 100</h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>Based on continuous IoT telemetry and carbon offset auditing.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: Certificates & Reports */}
                  {esgDetailView === 'certificates' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="soft-card" style={{ padding: '28px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px' }}>PDF DOCUMENT</span>
                            <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Download Sustainability Report</h4>
                            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Comprehensive audit of waste diversion, recycling efficiency, and grant compliance.</p>
                          </div>
                          <button className="btn-emerald" style={{ width: '100%', height: '42px', fontSize: '13px', margin: 0 }}>
                            Download Sustainability Report ➔
                          </button>
                        </div>
                        <div className="soft-card" style={{ padding: '28px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px', background: '#EFF6FF', color: '#2563EB' }}>VERIFIED LEDGER</span>
                            <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Download Carbon Credit Report</h4>
                            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Detailed GHG reduction ledgers ready for credit issuance and trading.</p>
                          </div>
                          <button className="btn-emerald" style={{ width: '100%', height: '42px', fontSize: '13px', margin: 0 }}>
                            Download Carbon Credit Report ➔
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                          <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px' }}>BLOCKCHAIN SECURED</span>
                          <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Carbon Credit Certificate</h4>
                          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>ID: <strong style={{ color: '#059669' }}>GGOS-CC-9928-ISB</strong></p>
                          <button className="btn-outline" style={{ width: '100%', height: '40px', fontSize: '13px', margin: 0 }}>View Carbon Credit Certificate</button>
                        </div>
                        <div className="soft-card" style={{ padding: '28px', margin: 0 }}>
                          <span className="pill-badge" style={{ fontSize: '11px', marginBottom: '8px', background: '#FEF3C7', color: '#D97706' }}>VERIFIED ASSET</span>
                          <h4 style={{ margin: '8px 0 6px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>Compost Verification Certificate</h4>
                          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>ID: <strong style={{ color: '#D97706' }}>GGOS-CMP-4412-ICT</strong></p>
                          <button className="btn-outline" style={{ width: '100%', height: '40px', fontSize: '13px', margin: 0 }}>View Compost Verification Certificate</button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="soft-card" style={{ maxWidth: '750px', margin: '0 auto', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: '800' }}>System Notifications & Alerts</h3>
                <span className="pill-badge" style={{ background: '#ECFDF5', color: '#059669' }}>2 Unread</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#991B1B', fontSize: '14.5px', fontWeight: '700' }}>Critical Bin Capacity Alert</strong>
                    <span style={{ fontSize: '11.5px', color: '#EF4444', fontWeight: '600' }}>10 mins ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#7F1D1D', lineHeight: '1.5' }}>BIN-SG-01 in Main Kitchen has reached 100% capacity. Immediate pickup request recommended.</p>
                </div>

                <div style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#065F46', fontSize: '14.5px', fontWeight: '700' }}>Carbon Credit Minted Successfully</strong>
                    <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}>2 hours ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#047857', lineHeight: '1.5' }}>0.025 MT carbon credits have been successfully verified and added to your portfolio.</p>
                </div>

                <div style={{ background: '#F8FAFC', borderLeft: '4px solid #F59E0B', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14.5px', fontWeight: '700' }}>Monthly ESG Report Ready</strong>
                    <span style={{ fontSize: '11.5px', color: '#D97706', fontWeight: '600' }}>Yesterday</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Your Q3 sustainability audit report is now available for download in the ESG hub.</p>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE & SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="soft-card" style={{ maxWidth: '750px', margin: '0 auto', padding: '32px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: '800' }}>Generator Profile & Facility Settings</h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Manage your organization credentials and automated dispatch preferences.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Organization Name</label>
                    <input type="text" className="login-input" defaultValue={displayName} disabled style={{ background: '#F1F5F9', border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: '0.8' }} />
                  </div>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>City / Region</label>
                    <input type="text" className="login-input" defaultValue={userCity} disabled style={{ background: '#F1F5F9', border: '1px solid var(--border-color)', color: 'var(--text-primary)', opacity: '0.8' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Primary Contact Phone</label>
                    <input type="text" className="login-input" defaultValue={userPhone} style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="login-form-group">
                    <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Estimated Daily Waste</label>
                    <input type="text" className="login-input" defaultValue={wasteEstimate} style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div className="login-form-group">
                  <label style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>Facility Street Address</label>
                  <textarea rows="2" className="login-input" defaultValue="Plot 5, Commercial Sector F-7/2, Islamabad" style={{ resize: 'vertical', background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="btn-emerald" style={{ padding: '0 28px', height: '44px', fontSize: '14px' }}>
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}