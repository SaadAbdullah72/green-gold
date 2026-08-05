import React, { useState } from 'react';

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
        { id: 'overview', label: '📊 Dashboard Overview' },
      ]
    },
    {
      title: "BIN MANAGEMENT",
      items: [
        { id: 'request_bin', label: '➕ Request Smart Bin' },
        { id: 'bins', label: '🗑️ My Bins Status' },
      ]
    },
    {
      title: "PICKUP & LOGISTICS",
      items: [
        { id: 'filled_bin_pickup', label: '🚛 Filled Bin Pickup Request' },
      ]
    },
    {
      title: "SUSTAINABILITY & ESG",
      items: [
        { id: 'sustainability_esg', label: '🌱 Sustainability & ESG' },
      ]
    },
    {
      title: "ACCOUNT & SETTINGS",
      items: [
        { id: 'notifications', label: '🔔 Notifications' },
        { id: 'profile', label: '👤 Profile & Settings' },
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

      {/* TOP HEADER / BRANDING BAR */}
      <header className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5, 15, 10, 0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="login-logo-icon" style={{ width: '38px', height: '38px' }}>
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '700', letterSpacing: '0.5px' }}>GreenGoldOS</h2>
            <span style={{ fontSize: '11px', color: 'var(--gold-light, #fbbf24)', fontWeight: '600' }}>WASTE GENERATOR PORTAL</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{displayName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>{userCity}</div>
          </div>
          <button 
            onClick={onLogout}
            className="guest-bypass-btn"
            style={{ margin: 0, padding: '6px 14px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            Logout ➔
          </button>
        </div>
      </header>

      {/* BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* LEFT SIDEBAR */}
        <aside style={{ 
          width: '270px', background: 'rgba(5, 15, 10, 0.65)', backdropFilter: 'blur(8px)', 
          borderRight: '1px solid rgba(255,255,255,0.08)', padding: '20px 12px',
          display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto',
          maxHeight: 'calc(100vh - 71px)', position: 'sticky', top: '71px'
        }}>
          {menuSections.map((sec, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-light, #fbbf24)', paddingLeft: '8px', marginBottom: '6px', letterSpacing: '0.5px' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sec.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setEsgDetailView(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px',
                      borderRadius: '8px', border: 'none',
                      background: activeTab === item.id ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                      color: activeTab === item.id ? 'var(--gold-light, #fbbf24)' : '#d1d5db',
                      fontWeight: activeTab === item.id ? '700' : '500', fontSize: '13px',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                      borderLeft: activeTab === item.id ? '3px solid var(--gold-light, #fbbf24)' : '3px solid transparent'
                    }}
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
              <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '28px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 15, 10, 0.85) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', letterSpacing: '0.5px' }}>GENERATOR PORTAL CONTROL DECK</span>
                <h2 style={{ fontSize: '26px', color: '#fff', margin: '6px 0 8px 0', fontWeight: '800' }}>Welcome back, {displayName}</h2>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, maxWidth: '700px', lineHeight: '1.5' }}>
                  Monitor real-time waste diversion telemetry, manage smart bin requests, and access your sustainability metrics seamlessly through the quick category navigation hubs below.
                </p>
              </div>

              {/* Category Quick Navigation Hub (Professional Grid Layout with 1 Link Button per Category) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' }}>
                  📂 MAIN CATEGORY NAVIGATION
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  
                  {/* Category 1: Bin Management */}
                  <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', background: 'rgba(5, 15, 10, 0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700', marginBottom: '6px' }}>BIN MANAGEMENT</div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px' }}>Smart Bins & Allotments</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>Request new IoT waste bins or monitor real-time fill capacities and sensor metrics.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => setActiveTab('request_bin')} 
                        className="login-btn" 
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px' }}
                      >
                        Request Smart Bin ➔
                      </button>
                      <button 
                        onClick={() => setActiveTab('bins')} 
                        className="guest-bypass-btn" 
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px' }}
                      >
                        My Bins Status ➔
                      </button>
                    </div>
                  </div>

                  {/* Category 2: Pickup & Logistics */}
                  <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', background: 'rgba(5, 15, 10, 0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700', marginBottom: '6px' }}>PICKUP & LOGISTICS</div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px' }}>Dispatches & Live Tracking</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>Initiate filled bin pickup requests and track assigned transport vehicles in real-time.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('filled_bin_pickup')} 
                      className="login-btn" 
                      style={{ width: '100%', margin: 0, padding: '10px', fontSize: '12px' }}
                    >
                      Open Pickup & Logistics Hub ➔
                    </button>
                  </div>

                  {/* Category 3: Sustainability & ESG */}
                  <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', background: 'rgba(5, 15, 10, 0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700', marginBottom: '6px' }}>SUSTAINABILITY & ESG</div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px' }}>Carbon & Impact Reports</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>Inspect verified carbon credits, waste diversion totals, ESG ratings, and audit certificates.</p>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('sustainability_esg'); setEsgDetailView(null); }} 
                      className="login-btn" 
                      style={{ width: '100%', margin: 0, padding: '10px', fontSize: '12px' }}
                    >
                      Open ESG Hub ➔
                    </button>
                  </div>

                  {/* Category 4: Account & Settings */}
                  <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', background: 'rgba(5, 15, 10, 0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700', marginBottom: '6px' }}>ACCOUNT & SETTINGS</div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '18px' }}>Facility Profile & Alerts</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>Manage organization credentials, contact details, and review system notifications.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => setActiveTab('notifications')} 
                        className="guest-bypass-btn" 
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px' }}
                      >
                        Notifications ➔
                      </button>
                      <button 
                        onClick={() => setActiveTab('profile')} 
                        className="login-btn" 
                        style={{ flex: 1, margin: 0, padding: '10px', fontSize: '12px' }}
                      >
                        Profile Settings ➔
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* 2. REQUEST SMART BIN (Proper Form) */}
          {activeTab === 'request_bin' && (
            <div className="login-card mgmt-sub-view" style={{ margin: '0 auto', maxWidth: '700px', padding: '28px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '6px', fontSize: '20px', color: 'var(--gold-light, #fbbf24)', textAlign: 'center' }}>
                ➕ Request Smart Bin Allotment Form
              </h3>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
                Fill out the complete details below to request additional IoT-enabled organic waste bins.
              </p>
              <form onSubmit={handleBinRequestSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label>Location / Department Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Main Kitchen, Floor 2" 
                      value={binRequestForm.locationName} 
                      onChange={(e) => setBinRequestForm({...binRequestForm, locationName: e.target.value})} 
                      className="login-input" 
                    />
                  </div>
                  <div className="login-form-group">
                    <label>Facility Category *</label>
                    <select 
                      value={binRequestForm.category} 
                      onChange={(e) => setBinRequestForm({...binRequestForm, category: e.target.value})} 
                      className="login-input"
                    >
                      <option value="Commercial Unit" style={{ background: '#08100c' }}>Commercial / Plaza / Retail</option>
                      <option value="Restaurant / Cafe / Hotel" style={{ background: '#08100c' }}>Restaurant / Cafe / Hotel</option>
                      <option value="Institutional / Cafeteria" style={{ background: '#08100c' }}>Institutional / Cafeteria</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label>Contact Number *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+92 300 1234567" 
                      value={binRequestForm.contactNumber} 
                      onChange={(e) => setBinRequestForm({...binRequestForm, contactNumber: e.target.value})} 
                      className="login-input" 
                    />
                  </div>
                  <div className="login-form-group">
                    <label>Bins Quantity Needed *</label>
                    <select 
                      value={binRequestForm.binsNeeded} 
                      onChange={(e) => setBinRequestForm({...binRequestForm, binsNeeded: e.target.value})} 
                      className="login-input"
                    >
                      <option value="1" style={{ background: '#08100c' }}>1 Unit</option>
                      <option value="2" style={{ background: '#08100c' }}>2 Units</option>
                      <option value="3" style={{ background: '#08100c' }}>3 Units</option>
                      <option value="5" style={{ background: '#08100c' }}>5+ Units</option>
                    </select>
                  </div>
                </div>

                <div className="login-form-group">
                  <label>Complete Street Address / Placement Instructions *</label>
                  <textarea 
                    rows="3" 
                    required 
                    placeholder="Enter precise street address, building block, or floor level..." 
                    value={binRequestForm.fullAddress} 
                    onChange={(e) => setBinRequestForm({...binRequestForm, fullAddress: e.target.value})} 
                    className="login-input" 
                    style={{ resize: 'vertical' }} 
                  />
                </div>

                <div className="login-form-group">
                  <label>Special Deployment Notes (Optional)</label>
                  <textarea 
                    rows="2" 
                    placeholder="Mention specific sensor requirements or delivery timings..." 
                    value={binRequestForm.specialInstructions} 
                    onChange={(e) => setBinRequestForm({...binRequestForm, specialInstructions: e.target.value})} 
                    className="login-input" 
                    style={{ resize: 'vertical' }} 
                  />
                </div>

                <button type="submit" className="login-btn" style={{ marginTop: '10px', width: '100%', padding: '12px' }}>
                  📩 Submit Smart Bin Allotment Request
                </button>
              </form>
            </div>
          )}

          {/* 3. MY BINS STATUS */}
          {activeTab === 'bins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="login-card mgmt-sub-view" style={{ padding: '20px', margin: 0 }}>
                <h3 style={{ marginTop: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '18px' }}>🗑️ My Smart Bins Real-Time Telemetry</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {smartBins.map((bin, index) => (
                  <div key={index} className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px', border: bin.fillPercent === 100 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{bin.id}</h4>
                      <span style={{ fontSize: '11px', background: bin.fillPercent === 100 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: bin.fillPercent === 100 ? '#f87171' : '#34d399', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                        {bin.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Location: <strong style={{ color: '#fff' }}>{bin.location}</strong></p>
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#9ca3af' }}>Capacity Filled:</span>
                        <span style={{ color: '#fff', fontWeight: '700' }}>{bin.fillPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${bin.fillPercent}%`, height: '100%', background: bin.fillPercent === 100 ? '#ef4444' : 'var(--gold-light, #fbbf24)' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '14px' }}>
                      <div><span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Air Quality</span><strong style={{ fontSize: '11px', color: '#60a5fa' }}>{bin.airQuality}</strong></div>
                      <div><span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Moisture</span><strong style={{ fontSize: '12px', color: '#34d399' }}>{bin.moisture}</strong></div>
                      <div><span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Odor Level</span><strong style={{ fontSize: '12px', color: '#facc15' }}>{bin.odor}</strong></div>
                    </div>
                    {bin.fillPercent === 100 && (
                      <button onClick={() => setShowPickupFormModal(true)} className="login-btn" style={{ width: '100%', padding: '8px', fontSize: '12px', background: '#ef4444', margin: 0 }}>
                        🚨 Request Filled Bin Pickup
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
              <div className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ marginTop: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '20px', marginBottom: '4px' }}>
                    🚛 Filled Bin Pickup & Live Tracking
                  </h3>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                    Request dispatches for full bins and monitor active vehicle tracking below.
                  </p>
                </div>
                <div>
                  <button onClick={() => setShowPickupFormModal(true)} className="login-btn" style={{ width: 'auto', padding: '10px 18px', margin: 0 }}>
                    + Request Pickup
                  </button>
                </div>
              </div>

              {/* Live Tracking Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>Active Dispatches & Tracking</h4>
                {pickupRequests.slice(0, 1).map((req, idx) => (
                  <div key={idx} className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>{req.requestId}</span>
                        <h4 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '16px' }}>Reason: {req.reason}</h4>
                      </div>
                      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>{req.status}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <div><span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Collector Name</span><strong style={{ fontSize: '13px', color: '#fff' }}>{req.collectorName}</strong></div>
                      <div><span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Vehicle Number</span><strong style={{ fontSize: '13px', color: '#60a5fa' }}>{req.vehicleNumber}</strong></div>
                      <div><span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Estimated Arrival (ETA)</span><strong style={{ fontSize: '13px', color: '#facc15' }}>{req.eta}</strong></div>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '10px' }}>Live Tracking Progress:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {trackingSteps.map((step, sIdx) => {
                        const isCompleted = sIdx <= req.currentStepIndex;
                        const isCurrent = sIdx === req.currentStepIndex;
                        return (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isCompleted ? (isCurrent ? '#fbbf24' : '#10b981') : 'rgba(255,255,255,0.1)', color: '#050f0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                              {isCompleted ? '✓' : ''}
                            </div>
                            <span style={{ fontSize: '13px', color: isCurrent ? '#fbbf24' : (isCompleted ? '#fff' : '#6b7280'), fontWeight: isCurrent ? '700' : '400' }}>{step}</span>
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
                  <h4 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>📜 Past Pickup Request History Archive</h4>
                  <span style={{ fontSize: '12px', color: 'var(--gold-light, #fbbf24)', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>Total Diverted: 125 kg</span>
                </div>
                {pickupRequests.map((req, idx) => (
                  <div key={idx} className="login-card mgmt-sub-view" style={{ padding: '20px', margin: 0, background: 'linear-gradient(135deg, rgba(8, 20, 14, 0.9) 0%, rgba(4, 10, 7, 0.95) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold-light, #fbbf24)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                          {req.requestId}
                        </span>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>{req.reason}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                        📅 {req.date}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px', marginBottom: '14px' }}>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: '11px', display: 'block' }}>Assigned Collector</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{req.collectorName}</span>
                      </div>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: '11px', display: 'block' }}>Vehicle Unit</span>
                        <span style={{ color: '#60a5fa', fontWeight: '600' }}>{req.vehicleNumber}</span>
                      </div>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: '11px', display: 'block' }}>Recorded Weight</span>
                        <span style={{ color: '#34d399', fontWeight: '600' }}>{req.weight}</span>
                      </div>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: '11px', display: 'block' }}>Final Status</span>
                        <span style={{ color: '#facc15', fontWeight: '700' }}>● {req.status}</span>
                      </div>
                    </div>
                    {req.notes && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#9ca3af', borderLeft: '3px solid #10b981' }}>
                        <strong style={{ color: '#fff' }}>Note:</strong> {req.notes}
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
                  <div className="login-card mgmt-sub-view" style={{ padding: '20px 24px', margin: 0 }}>
                    <h3 style={{ margin: '0 0 4px 0', color: 'var(--gold-light, #fbbf24)', fontSize: '20px' }}>🌱 Sustainability & ESG Hub</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                      Track carbon credit measurement, transparency metrics, and grant eligibility through the core modules below. Click any card to open its dedicated view.
                    </p>
                  </div>

                  {/* 4 Interactive Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                    
                    {/* Card 1: Carbon Footprint */}
                    <div 
                      onClick={() => setEsgDetailView('carbon')}
                      className="login-card mgmt-sub-view" 
                      style={{ 
                        margin: 0, padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease',
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5, 15, 10, 0.6)'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>🌿 Carbon Footprint</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>View CO₂ emissions reduced and active carbon credits earned.</p>
                      <span style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>Open View ➔</span>
                    </div>

                    {/* Card 2: Waste Impact */}
                    <div 
                      onClick={() => setEsgDetailView('waste')}
                      className="login-card mgmt-sub-view" 
                      style={{ 
                        margin: 0, padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease',
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5, 15, 10, 0.6)'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>♻️ Waste Impact</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Monitor organic waste diverted and compost generated in kilograms.</p>
                      <span style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>Open View ➔</span>
                    </div>

                    {/* Card 3: ESG Score */}
                    <div 
                      onClick={() => setEsgDetailView('esg')}
                      className="login-card mgmt-sub-view" 
                      style={{ 
                        margin: 0, padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease',
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5, 15, 10, 0.6)'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>📊 ESG Score</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Inspect overall ESG rating and calculated sustainability score.</p>
                      <span style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>Open View ➔</span>
                    </div>

                    {/* Card 4: Certificates & Reports */}
                    <div 
                      onClick={() => setEsgDetailView('certificates')}
                      className="login-card mgmt-sub-view" 
                      style={{ 
                        margin: 0, padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease',
                        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5, 15, 10, 0.6)'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>🏆 Certificates & Reports</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Access downloadable audit reports and verified digital certificates.</p>
                      <span style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>Open View ➔</span>
                    </div>

                  </div>
                </>
              ) : (
                /* Dedicated New Screen View with Professional Header Layout */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Top Bar with Properly Separated Corner Back Button and Centered Heading */}
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', alignItems: 'center', background: 'rgba(5, 15, 10, 0.8)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Small Corner Back Button */}
                    <button 
                      onClick={() => setEsgDetailView(null)} 
                      className="guest-bypass-btn" 
                      style={{ 
                        margin: 0, 
                        padding: '4px 10px', 
                        fontSize: '11px', 
                        height: 'auto', 
                        minHeight: 'unset',
                        lineHeight: '1.2',
                        justifySelf: 'start'
                      }}
                    >
                      ← Back
                    </button>

                    {/* Centered Heading */}
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700', textAlign: 'center', justifySelf: 'center' }}>
                      {esgDetailView === 'carbon' && '🌿 Carbon Footprint'}
                      {esgDetailView === 'waste' && '♻️ Waste Impact'}
                      {esgDetailView === 'esg' && '📊 ESG Score'}
                      {esgDetailView === 'certificates' && '🏆 Certificates & Reports'}
                    </h3>
                    
                    {/* Empty spacer div to maintain grid balance */}
                    <div></div>
                  </div>

                  {/* Screen Content: Carbon Footprint */}
                  {esgDetailView === 'carbon' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>CO₂ EMISSIONS REDUCED</span>
                        <h2 style={{ fontSize: '38px', color: '#34d399', margin: '10px 0 6px 0', fontWeight: '800' }}>0.85 MT</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Verified greenhouse gas reductions certified through automated organic waste routing.</p>
                      </div>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>CARBON CREDITS EARNED</span>
                        <h2 style={{ fontSize: '38px', color: 'var(--gold-light, #fbbf24)', margin: '10px 0 6px 0', fontWeight: '800' }}>12.4 Credits</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Eligible for corporate sustainability grants and carbon offset monetization.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: Waste Impact */}
                  {esgDetailView === 'waste' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>TOTAL ORGANIC WASTE DIVERTED (KG)</span>
                        <h2 style={{ fontSize: '38px', color: '#10b981', margin: '10px 0 6px 0', fontWeight: '800' }}>1,420 kg</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Total kitchen and food waste successfully diverted from municipal landfills.</p>
                      </div>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>COMPOST GENERATED (KG)</span>
                        <h2 style={{ fontSize: '38px', color: '#facc15', margin: '10px 0 6px 0', fontWeight: '800' }}>710 kg</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>High-grade nutrient fertilizer output produced for regional agriculture.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: ESG Score */}
                  {esgDetailView === 'esg' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>OVERALL ESG RATING</span>
                        <h2 style={{ fontSize: '38px', color: '#34d399', margin: '10px 0 6px 0', fontWeight: '800' }}>Grade A</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Top-tier corporate compliance rating for environmental excellence.</p>
                      </div>
                      <div className="login-card mgmt-sub-view" style={{ padding: '28px', margin: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>SUSTAINABILITY SCORE</span>
                        <h2 style={{ fontSize: '38px', color: 'var(--gold-light, #fbbf24)', margin: '10px 0 6px 0', fontWeight: '800' }}>94.2 / 100</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Based on continuous IoT telemetry and carbon offset auditing.</p>
                      </div>
                    </div>
                  )}

                  {/* Screen Content: Certificates & Reports */}
                  {esgDetailView === 'certificates' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>PDF DOCUMENT</span>
                            <h4 style={{ margin: '6px 0 6px 0', color: '#fff', fontSize: '16px' }}>Download Sustainability Report</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Comprehensive audit of waste diversion, recycling efficiency, and grant compliance.</p>
                          </div>
                          <button className="login-btn" style={{ width: '100%', padding: '10px', fontSize: '12px', margin: 0 }}>
                            📥 Download Sustainability Report
                          </button>
                        </div>
                        <div className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>VERIFIED LEDGER</span>
                            <h4 style={{ margin: '6px 0 6px 0', color: '#fff', fontSize: '16px' }}>Download Carbon Credit Report</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Detailed GHG reduction ledgers ready for credit issuance and trading.</p>
                          </div>
                          <button className="login-btn" style={{ width: '100%', padding: '10px', fontSize: '12px', margin: 0 }}>
                            📥 Download Carbon Credit Report
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        <div className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0 }}>
                          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>BLOCKCHAIN SECURED</span>
                          <h4 style={{ margin: '6px 0 6px 0', color: '#fff', fontSize: '16px' }}>Carbon Credit Certificate</h4>
                          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>ID: <strong style={{ color: '#fbbf24' }}>GGOS-CC-9928-ISB</strong></p>
                          <button className="login-btn" style={{ width: '100%', padding: '10px', fontSize: '12px', margin: 0 }}>View Carbon Credit Certificate</button>
                        </div>
                        <div className="login-card mgmt-sub-view" style={{ padding: '24px', margin: 0 }}>
                          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>VERIFIED ASSET</span>
                          <h4 style={{ margin: '6px 0 6px 0', color: '#fff', fontSize: '16px' }}>Compost Verification Certificate</h4>
                          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>ID: <strong style={{ color: '#fbbf24' }}>GGOS-CMP-4412-ICT</strong></p>
                          <button className="login-btn" style={{ width: '100%', padding: '10px', fontSize: '12px', margin: 0 }}>View Compost Verification Certificate</button>
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
            <div className="login-card mgmt-sub-view" style={{ maxWidth: '750px', margin: '0 auto', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '18px' }}>🔔 System Notifications & Alerts</h3>
                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>2 Unread</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid #ef4444', padding: '14px 16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Critical Bin Capacity Alert</strong>
                    <span style={{ fontSize: '11px', color: '#f87171' }}>10 mins ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>BIN-SG-01 in Main Kitchen has reached 100% capacity. Immediate pickup request recommended.</p>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', padding: '14px 16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Carbon Credit Minted Successfully</strong>
                    <span style={{ fontSize: '11px', color: '#34d399' }}>2 hours ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>0.025 MT carbon credits have been successfully verified and added to your portfolio.</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderLeft: '4px solid #fbbf24', padding: '14px 16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Monthly ESG Report Ready</strong>
                    <span style={{ fontSize: '11px', color: '#fbbf24' }}>Yesterday</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Your Q3 sustainability audit report is now available for download in the ESG hub.</p>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE & SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="login-card mgmt-sub-view" style={{ maxWidth: '750px', margin: '0 auto', padding: '28px' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'var(--gold-light, #fbbf24)', fontSize: '18px' }}>👤 Generator Profile & Facility Settings</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>Manage your organization credentials and automated dispatch preferences.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label>Organization Name</label>
                    <input type="text" className="login-input" defaultValue={displayName} disabled />
                  </div>
                  <div className="login-form-group">
                    <label>City / Region</label>
                    <input type="text" className="login-input" defaultValue={userCity} disabled />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="login-form-group">
                    <label>Primary Contact Phone</label>
                    <input type="text" className="login-input" defaultValue={userPhone} />
                  </div>
                  <div className="login-form-group">
                    <label>Estimated Daily Waste</label>
                    <input type="text" className="login-input" defaultValue={wasteEstimate} />
                  </div>
                </div>

                <div className="login-form-group">
                  <label>Facility Street Address</label>
                  <textarea rows="2" className="login-input" defaultValue="Plot 5, Commercial Sector F-7/2, Islamabad" style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button className="login-btn" style={{ width: 'auto', padding: '10px 24px', margin: 0 }}>
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