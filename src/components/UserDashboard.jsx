import React, { useState } from 'react';

export default function UserDashboard({ username, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Dynamic User Info
  const displayName = userData?.organizationName || userData?.fullName || username || 'Marriott Manager';
  const userCity = userData?.city || 'Islamabad Capital Territory';
  const wasteEstimate = userData?.wasteEstimate || '20–50 kg';

  // Sample Data States
  const [wasteLogs, setWasteLogs] = useState([
    { id: 'LOG-8801', date: '2026-08-03', weightKg: 42, type: 'Food Scraps', binId: 'BIN-SG-01', status: 'Collected' },
    { id: 'LOG-8802', date: '2026-08-02', weightKg: 28, type: 'Coffee Grounds', binId: 'BIN-SG-02', status: 'Collected' },
    { id: 'LOG-8803', date: '2026-08-01', weightKg: 65, type: 'Kitchen Waste', binId: 'BIN-SG-01', status: 'Collected' },
  ]);

  const [pickupForm, setPickupForm] = useState({
    wasteType: 'Mixed Organic',
    estimatedWeightKg: '25',
    preferredTime: 'Morning (09:00 AM - 12:00 PM)',
    notes: ''
  });

  const [depositForm, setDepositForm] = useState({ binId: 'BIN-SG-01', weight: '', category: 'Kitchen Waste' });
  const [pickupSuccessMsg, setPickupSuccessMsg] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    orgName: displayName,
    city: userCity,
    email: userData?.email || 'manager@marriott.com.pk',
    phone: userData?.phone || '+92 300 1234567',
    binCount: '2 Active Smart Bins',
    notificationsEnabled: true
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Left Sidebar Menu Items (Foodpanda Style)
  const menuItems = [
    { id: 'overview', label: '📊 Dashboard Overview' },
    { id: 'deposit', label: '♻️ Deposit Waste' },
    { id: 'history', label: '📜 Waste History' },
    { id: 'tracking', label: '🚛 Pickup Tracking' },
    { id: 'bins', label: '🗑️ Smart Bins Status' },
    { id: 'compost', label: '🌱 Compost Tracking' },
    { id: 'certificates', label: '📄 Digital Certificates' },
    { id: 'impact', label: '🌍 Carbon Impact' },
    { id: 'reports', label: '📊 ESG Reports' },
    { id: 'rewards', label: '🏆 Green Rewards' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'profile', label: '👤 Profile & Settings' },
  ];

  const handlePickupSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: parseFloat(pickupForm.estimatedWeightKg) || 20,
      type: pickupForm.wasteType,
      binId: 'BIN-SG-01',
      status: 'Scheduled'
    };
    
    setWasteLogs([newLog, ...wasteLogs]);
    setPickupSuccessMsg(true);
    setTimeout(() => setPickupSuccessMsg(false), 4000);
    setPickupForm({ wasteType: 'Mixed Organic', estimatedWeightKg: '25', preferredTime: 'Morning (09:00 AM - 12:00 PM)', notes: '' });
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: parseFloat(depositForm.weight) || 10,
      type: depositForm.category,
      binId: depositForm.binId,
      status: 'Deposited'
    };
    setWasteLogs([newLog, ...wasteLogs]);
    setDepositSuccessMsg(true);
    setTimeout(() => setDepositSuccessMsg(false), 4000);
    setDepositForm({ binId: 'BIN-SG-01', weight: '', category: 'Kitchen Waste' });
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* TOP HEADER / BRANDING BAR */}
      <header className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5, 15, 10, 0.85)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="login-logo-icon" style={{ width: '38px', height: '38px' }}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
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
        
        {/* FOODPANDA STYLE LEFT SIDEBAR MENU */}
        <aside style={{ 
          width: '260px', 
          background: 'rgba(5, 15, 10, 0.65)', 
          backdropFilter: 'blur(8px)', 
          borderRight: '1px solid rgba(255,255,255,0.08)', 
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 71px)',
          position: 'sticky',
          top: '71px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #9ca3af)', paddingLeft: '12px', marginBottom: '8px', letterSpacing: '0.5px' }}>
            NAVIGATION MENU
          </div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === item.id ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                color: activeTab === item.id ? 'var(--gold-light, #fbbf24)' : '#d1d5db',
                fontWeight: activeTab === item.id ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: activeTab === item.id ? '3px solid var(--gold-light, #fbbf24)' : '3px solid transparent'
              }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                
                <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.5px' }}>ORGANIC DIVERTED</span>
                  <h2 style={{ fontSize: '32px', color: '#10b981', margin: '10px 0 4px 0', fontWeight: '800' }}>135 kg</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-dark, #6b7280)' }}>Daily target: {wasteEstimate}</span>
                </div>

                <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.5px' }}>MINTED CARBON CREDITS</span>
                  <h2 style={{ fontSize: '32px', color: 'var(--gold-light, #fbbf24)', margin: '10px 0 4px 0', fontWeight: '800' }}>0.123 MT</h2>
                  <span style={{ fontSize: '12px', color: '#34d399' }}>Equivalent to 5 trees planted</span>
                </div>

                <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.5px' }}>ACTIVE SMART BINS</span>
                  <h2 style={{ fontSize: '32px', color: '#60a5fa', margin: '10px 0 4px 0', fontWeight: '800' }}>2 Bins</h2>
                  <span style={{ fontSize: '12px', color: '#34d399' }}>● Smart Monitoring Active</span>
                </div>

                <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.5px' }}>SORT ACCURACY</span>
                  <h2 style={{ fontSize: '32px', color: '#a78bfa', margin: '10px 0 4px 0', fontWeight: '800' }}>98.5%</h2>
                  <span style={{ fontSize: '12px', color: '#34d399' }}>Grade A Compliant</span>
                </div>

              </div>

              <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#34d399', fontWeight: '700' }}>Ready for Organic Waste Pickup?</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #9ca3af)' }}>Schedule a certified GreenGoldOS collector to haul filled bins to the processing plant.</p>
                </div>
                <button onClick={() => setActiveTab('tracking')} className="login-btn" style={{ width: 'auto', padding: '10px 24px', margin: 0 }}>
                  Request Pickup Now
                </button>
              </div>
            </div>
          )}

          {/* 2. DEPOSIT WASTE */}
          {activeTab === 'deposit' && (
            <div className="login-card mgmt-sub-view" style={{ margin: '0 auto', maxWidth: '600px', padding: '28px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: 'var(--gold-light, #fbbf24)', textAlign: 'center' }}>
                ♻️ Self-Deposit Waste Entry
              </h3>
              {depositSuccessMsg && (
                <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', marginBottom: '20px', fontSize: '13px' }}>
                  ✓ Waste entry logged successfully into smart bin registry!
                </div>
              )}
              <form onSubmit={handleDepositSubmit}>
                <div className="login-form-group">
                  <label>Select Target Smart Bin</label>
                  <select value={depositForm.binId} onChange={(e)=>setDepositForm({...depositForm, binId: e.target.value})} className="login-input">
                    <option value="BIN-SG-01" style={{ background: '#08100c' }}>BIN-SG-01 (Main Kitchen - Organic)</option>
                    <option value="BIN-SG-02" style={{ background: '#08100c' }}>BIN-SG-02 (Cafeteria - Coffee Grounds)</option>
                  </select>
                </div>
                <div className="login-form-group">
                  <label>Measured Weight (Kg)</label>
                  <input type="number" required value={depositForm.weight} onChange={(e)=>setDepositForm({...depositForm, weight: e.target.value})} className="login-input" placeholder="e.g. 35" />
                </div>
                <div className="login-form-group">
                  <label>Waste Sub-type</label>
                  <select value={depositForm.category} onChange={(e)=>setDepositForm({...depositForm, category: e.target.value})} className="login-input">
                    <option value="Kitchen Waste" style={{ background: '#08100c' }}>Raw Kitchen Scraps</option>
                    <option value="Cooked Food" style={{ background: '#08100c' }}>Cooked Leftovers</option>
                    <option value="Coffee Grounds" style={{ background: '#08100c' }}>Coffee Grounds & Tea</option>
                  </select>
                </div>
                <button type="submit" className="login-btn" style={{ marginTop: '10px' }}>Log Deposit</button>
              </form>
            </div>
          )}

          {/* 3. WASTE HISTORY */}
          {activeTab === 'history' && (
            <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#fff' }}>📜 Complete Waste Deposit History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted, #9ca3af)' }}>
                      <th style={{ padding: '12px' }}>Log ID</th>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Bin Reference</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Weight (Kg)</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>{log.id}</td>
                        <td style={{ padding: '12px', color: '#fff' }}>{log.date}</td>
                        <td style={{ padding: '12px', color: '#60a5fa' }}>{log.binId}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted, #9ca3af)' }}>{log.type}</td>
                        <td style={{ padding: '12px', color: '#fff', fontWeight: '700' }}>{log.weightKg} kg</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. PICKUP TRACKING */}
          {activeTab === 'tracking' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--gold-light, #fbbf24)' }}>🚚 Request New Dispatch</h3>
                {pickupSuccessMsg && <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', marginBottom: '15px', fontSize: '12px' }}>Request Dispatched!</div>}
                <form onSubmit={handlePickupSubmit}>
                  <div className="login-form-group">
                    <label>Waste Category</label>
                    <select value={pickupForm.wasteType} onChange={(e) => setPickupForm({...pickupForm, wasteType: e.target.value})} className="login-input">
                      <option value="Mixed Organic" style={{ background: '#08100c' }}>Mixed Organic Waste</option>
                      <option value="Food Scraps" style={{ background: '#08100c' }}>Kitchen & Food Scraps</option>
                    </select>
                  </div>
                  <div className="login-form-group">
                    <label>Weight (Kg)</label>
                    <input type="number" value={pickupForm.estimatedWeightKg} onChange={(e) => setPickupForm({...pickupForm, estimatedWeightKg: e.target.value})} className="login-input" required />
                  </div>
                  <button type="submit" className="login-btn">Dispatch Pickup Fleet</button>
                </form>
              </div>

              <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: '#10b981' }}>📡 Active Pickup Dispatch Status</h3>
                <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '14px', margin: '15px 0' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff' }}>Vehicle: ICT-GRN-9912</p>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af' }}>Driver: Muhammad Ali (Verified Collector)</p>
                  <span style={{ fontSize: '12px', color: 'var(--gold-light, #fbbf24)', fontWeight: '700' }}>● En Route — ETA 18 mins</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. SMART BINS */}
          {activeTab === 'bins' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>BIN-SG-01 (Main Kitchen)</h4>
                  <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>Online</span>
                </div>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Capacity Filled: <strong>78%</strong></p>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', margin: '10px 0' }}>
                  <div style={{ width: '78%', height: '100%', background: 'var(--gold-light, #fbbf24)' }}></div>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Sensor ID: SENSOR-9920A</p>
              </div>

              <div className="login-card mgmt-sub-view" style={{ margin: 0, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>BIN-SG-02 (Cafeteria)</h4>
                  <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>Online</span>
                </div>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Capacity Filled: <strong>32%</strong></p>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', margin: '10px 0' }}>
                  <div style={{ width: '32%', height: '100%', background: '#10b981' }}></div>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Sensor ID: SENSOR-9921B</p>
              </div>
            </div>
          )}

          {/* 6. COMPOST TRACKING */}
          {activeTab === 'compost' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#34d399' }}>🌱 Facility Compost Processing Pipeline</h3>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Track your organic waste conversion into high-grade bio-fertilizer.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>BATCH #CP-2026-08</span>
                  <h4 style={{ color: '#fbbf24', margin: '6px 0' }}>Thermophilic Phase</h4>
                  <p style={{ fontSize: '12px', color: '#34d399', margin: 0 }}>Temp: 58°C (Optimal)</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>ESTIMATED YIELD</span>
                  <h4 style={{ color: '#10b981', margin: '6px 0' }}>450 Kg Organic Fertilizer</h4>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Ready in ~12 Days</p>
                </div>
              </div>
            </div>
          )}

          {/* 7. DIGITAL CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: 'var(--gold-light, #fbbf24)' }}>📄 ESG Compliance & Sustainability Certificates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#fff' }}>Monthly Zero-Waste Verification (August 2026)</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>Issued by GreenGoldOS Environmental Authority</p>
                  </div>
                  <button className="login-btn" style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }}>Download PDF</button>
                </div>
              </div>
            </div>
          )}

          {/* 8. CARBON IMPACT */}
          {activeTab === 'impact' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#10b981' }}>🌍 Environmental & Carbon Audit Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Methane Gas Avoided</span>
                  <h2 style={{ color: '#34d399', margin: '6px 0' }}>1,840 m³</h2>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Total Carbon Offset</span>
                  <h2 style={{ color: '#fbbf24', margin: '6px 0' }}>3.45 MT CO2e</h2>
                </div>
              </div>
            </div>
          )}

          {/* 9. REPORTS */}
          {activeTab === 'reports' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#60a5fa' }}>📊 Corporate ESG & Waste Audit Reports</h3>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Generate comprehensive audit logs for internal corporate compliance.</p>
              <button className="login-btn" style={{ width: 'auto', marginTop: '10px' }}>Export Full Audit Log (.CSV)</button>
            </div>
          )}

          {/* 10. REWARDS */}
          {activeTab === 'rewards' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#a78bfa' }}>🏆 Green Gold Points & Loyalty Program</h3>
              <div style={{ padding: '16px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', borderRadius: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>AVAILABLE REWARD BALANCE</span>
                <h2 style={{ color: '#a78bfa', margin: '6px 0' }}>850 Points</h2>
              </div>
              <button className="login-btn" style={{ width: 'auto' }}>Redeem for Free Organic Compost Bags</button>
            </div>
          )}

          {/* 11. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>🔔 System Alerts & Updates</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', fontSize: '13px', color: '#9ca3af' }}>
                <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>🟢 <strong>Collection Complete:</strong> BIN-SG-01 emptied successfully at 04:30 PM.</li>
                <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>⚠️ <strong>Capacity Warning:</strong> BIN-SG-01 has reached 78% capacity.</li>
              </ul>
            </div>
          )}

          {/* 12. PROFILE & SETTINGS */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--gold-light, #fbbf24)', fontSize: '18px' }}>
                  👤 Profile Information
                </h3>

                {profileSavedMsg && (
                  <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', marginBottom: '16px', fontSize: '12px' }}>
                    ✓ Profile settings saved successfully!
                  </div>
                )}

                <form onSubmit={handleProfileSave}>
                  <div className="login-form-group">
                    <label>Organization Name</label>
                    <input 
                      type="text" 
                      value={profileData.orgName} 
                      onChange={(e) => setProfileData({...profileData, orgName: e.target.value})}
                      className="login-input" 
                    />
                  </div>

                  <div className="login-form-group">
                    <label>City / Location</label>
                    <input 
                      type="text" 
                      value={profileData.city} 
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      className="login-input" 
                    />
                  </div>

                  <div className="login-form-group">
                    <label>Official Contact Email</label>
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="login-input" 
                    />
                  </div>

                  <div className="login-form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="login-input" 
                    />
                  </div>

                  <button type="submit" className="login-btn" style={{ marginTop: '10px' }}>
                    Update Profile Details
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="login-card mgmt-sub-view" style={{ padding: '24px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#10b981', fontSize: '18px' }}>
                    ⚙️ System & Fleet Settings
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Hardware Status</label>
                    <input type="text" className="login-input" value={profileData.binCount} readOnly style={{ opacity: 0.8 }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Automated Pickup Dispatch</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Auto-request driver when bin fill exceeds 80%</div>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={true} 
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Email Alert Notifications</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Receive daily ESG & waste summary logs</div>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={profileData.notificationsEnabled} 
                      onChange={(e) => setProfileData({...profileData, notificationsEnabled: e.target.checked})}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                <div className="login-card mgmt-sub-view" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>SECURITY STATUS</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#fff' }}>2-Factor Authentication & Encrypted Smart Sensor Node Active.</p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}