import React, { useState } from 'react';

export default function ProcessingPlantDashboard({ 
  username = "Plant Supervisor", 
  location = "Islamabad Plant Yard #4", 
  onLogout 
}) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // SCADA Machinery Live Status
  const [equipment, setEquipment] = useState({
    conveyor: { name: 'Conveyor Belt System', status: true, load: '78%' },
    shredder: { name: 'Industrial Shredder Unit', status: true, load: '92%' },
    blowers: { name: 'Aeration Blowers (A-4)', status: true, load: '65%' },
    biofilter: { name: 'Bio-Filter Scrubber', status: false, load: '0%' }
  });

  // Weighbridge & Intake Waste Logs
  const [intakeLogs, setIntakeLogs] = useState([
    { id: 'TRK-901', source: 'Marriott Islamabad', weight: '1,850 kg', type: 'Food Waste', contamination: '1.2%', status: 'Approved' },
    { id: 'TRK-902', source: 'Centaurus Mall', weight: '2,400 kg', type: 'Mixed Organic', contamination: '4.1%', status: 'Pending Audit' },
    { id: 'TRK-903', source: 'Sector I-11 Market', weight: '3,900 kg', type: 'Vegetable Waste', contamination: '0.8%', status: 'Approved' },
  ]);

  // Active Compost Digestion Piles
  const [compostPiles, setCompostPiles] = useState([
    { id: 'PILE-2026-A1', stage: 'Thermophilic Fermentation', temp: '66°C', moisture: '58%', cnRatio: '28:1', methane: '0.02 ppm' },
    { id: 'PILE-2026-B3', stage: 'Maturation & Curing', temp: '48°C', moisture: '42%', cnRatio: '24:1', methane: '0.00 ppm' },
    { id: 'PILE-2026-C2', stage: 'Primary Shredding', temp: '38°C', moisture: '65%', cnRatio: '32:1', methane: '0.05 ppm' },
  ]);

  // Inventory Stock
  const [inventory] = useState([
    { id: 'BAG-50KG-A', grade: 'Grade-A Organic', stock: '1,240 Bags', warehouse: 'Aisle 3' },
    { id: 'BAG-25KG-B', grade: 'Grade-B Bio-Enriched', stock: '850 Bags', warehouse: 'Aisle 1' },
    { id: 'BULK-COMPOST', grade: 'Raw Unscreened', stock: '14.2 Tons', warehouse: 'Yard Bay 2' }
  ]);

  // Distribution Shipments
  const [distributionLogs] = useState([
    { id: 'SHP-101', destination: 'Agri-Corp Rawalpindi', quantity: '5 Tons', vehicle: 'Mazda Truck (ICT-789)', status: 'Dispatched' },
    { id: 'SHP-102', destination: 'Fauji Fertilizer Depot', quantity: '8.2 Tons', vehicle: 'Heavy Trailer (LHR-402)', status: 'In Transit' }
  ]);

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Thermal Threshold Warning', desc: 'Pile PILE-2026-A1 reached 66°C optimum mark.', time: '10:42 AM', read: false },
    { id: 2, title: 'Weighbridge Audit Pending', desc: 'Truck TRK-902 reported 4.1% contamination rate.', time: '09:15 AM', read: false },
    { id: 3, title: 'SCADA System Maintenance', desc: 'Bio-Filter Scrubber unit toggled to standby.', time: '08:00 AM', read: true }
  ]);

  // User Management State
  const [usersList] = useState([
    { name: 'Dr. Zeeshan Haider', role: 'Plant Director', status: 'Active', access: 'Full Root' },
    { name: 'Ayesha Malik', role: 'QA Lead', status: 'Active', access: 'Laboratory' },
    { name: 'Bilal Ahmed', role: 'Weighbridge Operator', status: 'On Shift', access: 'Logistics' }
  ]);

  // Modal State for New Digestion Pile
  const [showModal, setShowModal] = useState(false);
  const [newPile, setNewPile] = useState({ id: '', stage: 'Primary Shredding', temp: '35°C', moisture: '60%' });

  // System Audit Logs
  const [systemLogs] = useState([
    { type: 'audit', msg: 'Pile PILE-2026-A1 reached optimal thermophilic threshold (66°C).', time: '10:42 AM' },
    { type: 'logistics', msg: 'Weighbridge entry verified for Truck TRK-901 (1,850 kg).', time: '10:15 AM' },
    { type: 'system', msg: 'Bio-Filter Scrubber unit toggled to maintenance standby.', time: '09:30 AM' },
  ]);

  // ALIGNED SIDEBAR SECTIONS & COMBINED HEADINGS
  const menuSections = [
    {
      title: "OPERATIONS",
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
        { id: 'intake-collection', name: 'Intake & Collection', icon: '📥', badge: 1 },
        { id: 'scada', name: 'SCADA Equipment', icon: '⚙️' },
      ]
    },
    {
      title: "PROCESSING & QA",
      items: [
        { id: 'batches-monitoring', name: 'Batches & Monitoring', icon: '🌱' },
        { id: 'qa-certificates', name: 'Quality & Certificates', icon: '🧪' },
      ]
    },
    {
      title: "LOGISTICS & IMPACT",
      items: [
        { id: 'inventory', name: 'Inventory Stock', icon: '📦' },
        { id: 'distribution', name: 'Distribution', icon: '🚚' },
        { id: 'carbon', name: 'Carbon Impact & Reports', icon: '🌍' },
      ]
    },
    {
      title: "ADMINISTRATION",
      items: [
        { id: 'notifications', name: 'Notifications', icon: '🔔', badge: notifications.filter(n => !n.read).length },
        { id: 'users', name: 'User Management', icon: '👥' },
        { id: 'profile', name: 'Profile & Settings', icon: '👤' },
        { id: 'logout', name: 'Logout', icon: '🚪' }
      ]
    }
  ];

  const toggleEquipment = (key) => {
    setEquipment(prev => ({
      ...prev,
      [key]: { ...prev[key], status: !prev[key].status }
    }));
  };

  const handleCreatePile = (e) => {
    e.preventDefault();
    if (!newPile.id) return;
    setCompostPiles(prev => [
      { ...newPile, cnRatio: '30:1', methane: '0.01 ppm' },
      ...prev
    ]);
    setShowModal(false);
    setNewPile({ id: '', stage: 'Primary Shredding', temp: '35°C', moisture: '60%' });
  };

  const handleApproveIntake = (id) => {
    setIntakeLogs(prev => prev.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
  };

  const handleMenuClick = (id) => {
    if (id === 'logout') {
      onLogout();
      return;
    }
    setActiveTab(id);
  };

  return (
    <div className="app-container">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="sidebar-left" style={{ overflowY: 'auto' }}>
        <div className="app-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="logo-text">
            <h1>GreenGoldOS</h1>
            <span>PLANT OPERATIONS PORTAL</span>
          </div>
        </div>

        {/* SIDEBAR SECTIONS & ITEMS */}
        {menuSections.map((sec, idx) => (
          <React.Fragment key={idx}>
            <div className="menu-label">{sec.title}</div>
            <ul className="menu-list">
              {sec.items.map((item) => (
                <li key={item.id}>
                  <button 
                    className={`menu-btn ${activeTab === item.id ? 'active' : ''}`} 
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <div className="menu-btn-content">
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && <span className="badge-counter">{item.badge}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </React.Fragment>
        ))}

        {/* SIDEBAR FOOTER PROFILE */}
        <div className="sidebar-footer" style={{ marginTop: '20px' }}>
          <div className="profile-card">
            <div className="profile-avatar">{username.charAt(0)}</div>
            <div className="profile-info">
              <span className="name">{username}</span>
              <span className="role">{location}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="main-content">
        
        {/* HEADER */}
        <header className="view-header">
          <div>
            <h2>
              {menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.name || 'Plant Dashboard'}
            </h2>
            <p>Real-time telemetry, operational controls, and plant execution suite.</p>
          </div>
          <button className="action-btn approve" style={{ padding: '12px 24px', fontSize: '14px' }} onClick={() => setShowModal(true)}>
            + Initialize Digestion Pile
          </button>
        </header>

        {/* KPI METRIC CARDS (Visible on dashboard) */}
        {activeTab === 'dashboard' && (
          <section className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-title">
                <span>Daily Waste Intake</span>
                <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div className="kpi-value">8,150 <span style={{ fontSize: '18px', color: 'var(--primary)' }}>kg</span></div>
              <div className="kpi-label">Target: 10,000 kg / day</div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-title">
                <span>Carbon Credits Minted</span>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H8"/></svg>
              </div>
              <div className="kpi-value" style={{ color: 'var(--gold-light)' }}>1.64 <span style={{ fontSize: '18px' }}>MT</span></div>
              <div className="kpi-label">58.2 Trees Equivalent Saved</div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-title">
                <span>Active Digestion Piles</span>
                <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div className="kpi-value">6 <span style={{ fontSize: '18px', color: 'var(--secondary)' }}>Piles</span></div>
              <div className="kpi-label">Air Blowers: 100% Active</div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-title">
                <span>Compost Quality Index</span>
                <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="kpi-value">98.9%</div>
              <div className="kpi-label">Grade-A Organic Compliant</div>
            </div>
          </section>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="mgmt-sub-view" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="glass-panel">
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '10px' }}>📊 Live Bio-Pile Thermal Sensors (°C)</h3>
              <div className="chart-sim-wrapper">
                <div className="chart-bar" style={{ height: '85%' }} data-val="66°C"></div>
                <div className="chart-bar" style={{ height: '60%' }} data-val="48°C"></div>
                <div className="chart-bar" style={{ height: '45%' }} data-val="38°C"></div>
                <div className="chart-bar" style={{ height: '70%' }} data-val="55°C"></div>
                <div className="chart-bar" style={{ height: '90%' }} data-val="68°C"></div>
                <div className="chart-bar" style={{ height: '50%' }} data-val="42°C"></div>
              </div>
            </div>

            <section className="glass-panel logs-panel">
              <h3>📜 Real-Time SCADA System Logs</h3>
              <div className="logs-container" style={{ marginTop: '15px' }}>
                {systemLogs.map((log, index) => (
                  <div className="log-row" key={index}>
                    <span className={`log-badge ${log.type}`}>{log.type}</span>
                    <div>
                      <div className="log-message">{log.msg}</div>
                      <div className="log-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 2. INTAKE & COLLECTION (Combined Heading) */}
        {activeTab === 'intake-collection' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>📥 Weighbridge Receipts & Collection Verifications</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Truck ID</th>
                  <th>Commercial Source</th>
                  <th>Gross Weight</th>
                  <th>Waste Category</th>
                  <th>Contamination Rate</th>
                  <th>Audit Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {intakeLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{log.id}</td>
                    <td>{log.source}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{log.weight}</td>
                    <td>{log.type}</td>
                    <td style={{ color: parseFloat(log.contamination) > 3 ? 'var(--danger)' : 'var(--secondary)' }}>
                      {log.contamination}
                    </td>
                    <td>
                      <span className={`status-pill ${log.status === 'Approved' ? 'approved' : 'warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      {log.status === 'Pending Audit' ? (
                        <button className="action-btn approve" onClick={() => handleApproveIntake(log.id)}>
                          Approve Batch
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dark)' }}>Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. SCADA EQUIPMENT */}
        {activeTab === 'scada' && (
          <div className="mgmt-sub-view glass-panel">
            <h3>⚙️ Real-Time Industrial SCADA Equipment Control</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {Object.entries(equipment).map(([key, unit]) => (
                <div key={key} className="glass-panel glass-card-interactive" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#fff', fontSize: '16px' }}>{unit.name}</h4>
                    <span className={`status-pill ${unit.status ? 'approved' : 'warning'}`}>
                      {unit.status ? 'RUNNING' : 'OFFLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                    Operational Load: <strong style={{ color: 'var(--gold-light)' }}>{unit.load}</strong>
                  </div>
                  <button 
                    className={`action-btn ${unit.status ? 'deny' : 'approve'}`}
                    style={{ width: '100%', padding: '10px' }}
                    onClick={() => toggleEquipment(key)}
                  >
                    {unit.status ? 'STOP MACHINERY UNIT' : 'START MACHINERY UNIT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. BATCHES & MONITORING (Combined Heading) */}
        {activeTab === 'batches-monitoring' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>🌱 Active Compost Batches & Telemetry Monitoring</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Batch ID Code</th>
                  <th>Process Phase</th>
                  <th>Temperature</th>
                  <th>Moisture</th>
                  <th>C:N Ratio</th>
                  <th>Methane Leak</th>
                  <th>Telemetry Action</th>
                </tr>
              </thead>
              <tbody>
                {compostPiles.map((pile) => (
                  <tr key={pile.id}>
                    <td style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{pile.id}</td>
                    <td><span className="status-pill approved">{pile.stage}</span></td>
                    <td style={{ color: 'var(--danger)', fontWeight: '700' }}>{pile.temp}</td>
                    <td>{pile.moisture}</td>
                    <td style={{ color: 'var(--secondary)' }}>{pile.cnRatio}</td>
                    <td>{pile.methane}</td>
                    <td>
                      <button className="action-btn approve">Calibrate Sensors 📊</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. QUALITY & CERTIFICATES (Combined Heading) */}
        {activeTab === 'qa-certificates' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>🧪 Laboratory Quality Assurance & Digital Certificates</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Grade Compliance</th>
                  <th>Pathogen Status</th>
                  <th>Heavy Metals</th>
                  <th>Digital Certificate</th>
                </tr>
              </thead>
              <tbody>
                {compostPiles.map((pile) => (
                  <tr key={pile.id}>
                    <td style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{pile.id}</td>
                    <td><span className="status-pill approved">Grade-A Organic</span></td>
                    <td style={{ color: 'var(--secondary)' }}>Cleared (Zero Pathogens)</td>
                    <td style={{ color: 'var(--primary)' }}>Pass (&lt; 0.01 ppm)</td>
                    <td>
                      <button className="action-btn approve">Download Certificate PDF 📄</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. INVENTORY STOCK */}
        {activeTab === 'inventory' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>📦 Finished Product Warehouse Inventory Stock</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Grade Category</th>
                  <th>Stock Available</th>
                  <th>Warehouse Storage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{inv.id}</td>
                    <td><span className="status-pill approved">{inv.grade}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{inv.stock}</td>
                    <td>{inv.warehouse}</td>
                    <td>
                      <button className="action-btn approve">Update Stock 📦</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. DISTRIBUTION */}
        {activeTab === 'distribution' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>🚚 Commercial Distribution & Cargo Dispatches</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dispatch ID</th>
                  <th>Client Destination</th>
                  <th>Quantity Shipped</th>
                  <th>Transport Vehicle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {distributionLogs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{d.id}</td>
                    <td>{d.destination}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{d.quantity}</td>
                    <td>{d.vehicle}</td>
                    <td><span className="status-pill approved">{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. CARBON IMPACT & REPORTS */}
        {activeTab === 'carbon' && (
          <div className="mgmt-sub-view glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3>🌍 Carbon Impact & Environmental Sustainability Reports</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>TOTAL CO2 OFFSET</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gold-light)', margin: '10px 0' }}>1,420 Tons</div>
                <div style={{ fontSize: '12px', color: 'var(--primary)' }}>+14% vs last month</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>METHANE ABATEMENT</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary)', margin: '10px 0' }}>99.4%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Bio-Filter scrubbers optimal</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. NOTIFICATIONS VIEW */}
        {activeTab === 'notifications' && (
          <div className="mgmt-sub-view glass-panel">
            <h3>🔔 System Notifications & Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {notifications.map(n => (
                <div key={n.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '15px' }}>{n.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{n.desc}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-dark)' }}>{n.time}</span>
                  </div>
                  <span className={`status-pill ${n.read ? 'approved' : 'warning'}`}>
                    {n.read ? 'READ' : 'NEW'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="mgmt-sub-view glass-panel table-panel">
            <h3>👥 Plant Personnel & User Permissions</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Designation Role</th>
                  <th>Shift Status</th>
                  <th>Access Scope</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '700', color: '#fff' }}>{u.name}</td>
                    <td><span className="status-pill approved">{u.role}</span></td>
                    <td style={{ color: 'var(--primary)' }}>{u.status}</td>
                    <td style={{ color: 'var(--gold-light)' }}>{u.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 11. PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="mgmt-sub-view glass-panel" style={{ maxWidth: '600px' }}>
            <h3>👤 Plant Supervisor Profile & Terminal Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div className="login-form-group">
                <label>Supervisor Full Name</label>
                <input type="text" className="login-input" defaultValue={username} readOnly />
              </div>
              <div className="login-form-group">
                <label>Assigned Plant Facility</label>
                <input type="text" className="login-input" defaultValue={location} readOnly />
              </div>
              <div className="login-form-group">
                <label>SCADA Telemetry Protocol</label>
                <input type="text" className="login-input" defaultValue="MQTT-Secure / TLS 1.3" readOnly />
              </div>
              <button className="action-btn approve" style={{ padding: '12px', marginTop: '10px' }} onClick={() => alert('Settings saved successfully!')}>
                Save Configuration Updates
              </button>
            </div>
          </div>
        )}

      </main>

      {/* INITIALIZE PILE MODAL */}
      {showModal && (
        <div className="login-gate">
          <div className="login-card">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <h2>Initialize Digestion Pile</h2>
            </div>

            <form onSubmit={handleCreatePile}>
              <div className="login-form-group">
                <label>Pile ID Code</label>
                <input 
                  type="text" 
                  className="login-input" 
                  placeholder="e.g. PILE-2026-D4" 
                  value={newPile.id}
                  onChange={(e) => setNewPile({ ...newPile, id: e.target.value })}
                  required
                />
              </div>

              <div className="login-form-group">
                <label>Process Stage</label>
                <select 
                  className="login-input"
                  value={newPile.stage}
                  onChange={(e) => setNewPile({ ...newPile, stage: e.target.value })}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Primary Shredding" style={{ background: '#000' }}>Primary Shredding</option>
                  <option value="Thermophilic Fermentation" style={{ background: '#000' }}>Thermophilic Fermentation</option>
                  <option value="Maturation & Curing" style={{ background: '#000' }}>Maturation & Curing</option>
                </select>
              </div>

              <button type="submit" className="login-btn">Start Digestion Pile</button>
              <button type="button" className="guest-bypass-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}