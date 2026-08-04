import React from 'react';
import { TECH_CREWS, LOGISTICS_PARTNERS, FACTORY_REPORTS } from '../mockData';

/**
 * ManagementDashboard Presentational Component
 * 
 * Provides:
 * 1. Sidebar Control Panel: Includes branding, navigation links, and logout controls.
 * 2. KPI Cards Grid: Displays operational telemetry statistics (active bins, diverted waste, carbon offset weight).
 * 3. Reactive Sub-Tabs: Switches between:
 *    - Pending Installation Requests (with approval workflows).
 *    - Logistics Hauling Dispatch (with truck assignment actions).
 *    - Soil Attestation Carbon Credit Tokenizer (with minting triggers).
 *    - Factory performance statistics and monthly trends.
 *    - Active agreements audit ledger.
 * 4. Technicians & Carriers Selection Modals: Overlay dialog boxes for dispatching crews.
 */
export default function ManagementDashboard({
  username,
  onLogout,
  activeSubTab,
  setActiveSubTab,
  stats,
  activeSites,
  installRequests,
  batchesAwaitingCert,
  collectedWasteQueue,
  logs,
  factoryPeriod,
  setFactoryPeriod,
  handleApproveReq,
  handleDenyReq,
  handleCertifyCarbon,
  handleAssignLogistics,
  showTechModal,
  setShowTechModal,
  confirmApproveReq,
  showLogisticsModal,
  setShowLogisticsModal,
  confirmAssignLogistics
}) {
  // Extract user initials to render in the profile card avatar circle
  const initials = username.split(/[ _]/).map(w => w[0]).join("").toUpperCase().substring(0, 2);

  // Compute pending alert badges for each dashboard sub-tab
  const pendingApprovalsCount = installRequests.filter(r => r.status === 'Pending').length;
  const pendingLogisticsCount = collectedWasteQueue.filter(w => w.status === 'Awaiting Partner').length;
  const pendingCarbonCount = batchesAwaitingCert.filter(b => b.status === 'Awaiting Certification').length;

  return (
    <div className="app-container">
      
      {/* =========================================================================
          LEFT SIDEBAR NAVIGATION
          ========================================================================= */}
      <aside className="sidebar-left">
        {/* Brand Header */}
        <div className="app-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" stroke="url(#gold-grad-side)" strokeLinecap="round"/>
              <path d="M12 12c0-3-2-5-5-5c-2 0-3 2-1 4c3 3 6 1 6 1z" fill="var(--primary)"/>
              <path d="M12 12c0 3 2 5 5 5c2 0 3-2 1-4c-3-3-6-1-6-1z" fill="var(--gold-light)"/>
              <defs>
                <linearGradient id="gold-grad-side" x1="2" y1="2" x2="22" y2="22">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <h1>GreenGoldOS</h1>
            <span>Management Hub</span>
          </div>
        </div>

        {/* Portal selection list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
          <div>
            <h4 className="menu-label">Active Portal</h4>
            <ul className="menu-list">
              <li>
                <button className="menu-btn active">
                  <span className="menu-btn-content">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                    System Management
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Logout session Profile Card */}
        <div className="sidebar-footer">
          <div className="profile-card" onClick={onLogout} style={{ cursor: 'pointer' }} title="Click to log out">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <span className="name">{username}</span>
              <span className="role" style={{ color: 'var(--gold-light)', fontWeight: '600' }}>Logout ⮞</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN COMMAND CENTER CONTENT
          ========================================================================= */}
      <main className="main-content">
        
        {/* Section Header */}
        <div className="view-header">
          <div>
            <h2>Management Command Center</h2>
            <p>Admin, dispatch, and carbon offset ledgers</p>
          </div>
          <div>
            <span className="status-pill approved" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '700' }}>
              Executive Authority
            </span>
          </div>
        </div>

        {/* KPI Indicators Grid */}
        <div className="kpi-grid">
          {/* Gauge 1: Active provisions count */}
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Active Bins In Field</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="kpi-value">{stats.activeBins}</div>
            <div className="kpi-label">Across active client zones</div>
          </div>
          {/* Gauge 2: Weight statistics */}
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Organic diverted</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            </div>
            <div className="kpi-value">{stats.totalWasteDivertedKg.toLocaleString()} kg</div>
            <div className="kpi-label">Processed into organic products</div>
          </div>
          {/* Gauge 3: Minted carbon avoidance balance */}
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>MINTED CARBON CREDITS</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div className="kpi-value">{stats.certifiedCarbonCreditsMt.toFixed(2)} MT CO2e</div>
            <div className="kpi-label" style={{ color: 'var(--text-muted)' }}>Pending verification: {stats.pendingCarbonCreditsMt.toFixed(2)} MT</div>
          </div>
          {/* Gauge 4: Inorganic recovery sorting */}
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Plastics Recovered</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            </div>
            <div className="kpi-value">{stats.recycledPlasticsKg} kg</div>
            <div className="kpi-label">Sorted out at collection hubs</div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="mgmt-tabs">
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('approvals')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            Bin Requests
            {pendingApprovalsCount > 0 && <span className="badge-counter" style={{ marginLeft: '6px' }}>{pendingApprovalsCount}</span>}
          </button>
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'logistics' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('logistics')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            Assign Logistics
            {pendingLogisticsCount > 0 && <span className="badge-counter" style={{ marginLeft: '6px' }}>{pendingLogisticsCount}</span>}
          </button>
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'carbon' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('carbon')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Carbon Registry & Minting
            {pendingCarbonCount > 0 && <span className="badge-counter" style={{ marginLeft: '6px' }}>{pendingCarbonCount}</span>}
          </button>
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'factory' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('factory')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            Factory Reports
          </button>
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'sites' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('sites')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Active Sites Ledger
          </button>
        </div>

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 1: BIN INSTALLATION REQUESTS
            --------------------------------------------------------------------- */}
        {activeSubTab === 'approvals' && (
          <div className="mgmt-sub-view active">
            <div className="mgmt-grid-1col">
              <div className="glass-panel table-panel">
                <h3>Pending Smart Bin Requests</h3>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Client / Organization</th>
                        <th>Bins Req.</th>
                        <th>Placement Location</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installRequests.filter(r => r.status === 'Pending').length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No pending installations request found.
                          </td>
                        </tr>
                      ) : (
                        installRequests.filter(r => r.status === 'Pending').map(req => (
                          <tr key={req.id}>
                            <td><strong>{req.id}</strong></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{req.org}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contact: {req.contact} | {req.phone}</div>
                            </td>
                            <td><strong style={{ color: 'var(--gold-light)' }}>{req.binsRequested} Bins</strong></td>
                            <td>{req.location}</td>
                            <td>{req.requestDate}</td>
                            <td>
                              <div className="action-btn-group">
                                <button className="action-btn approve" onClick={() => handleApproveReq(req.id)}>Approve</button>
                                <button className="action-btn deny" onClick={() => handleDenyReq(req.id)}>Deny</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 2: LOGISTICS DISPATCH QUEUE
            --------------------------------------------------------------------- */}
        {activeSubTab === 'logistics' && (
          <div className="mgmt-sub-view active">
            <div className="mgmt-grid-1col">
              <div className="glass-panel table-panel">
                <h3>Collected Waste Awaiting Logistics Routing</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Bins emptied in the field. Dispatch a truck/fleet to route these loads to compost recycling plants.
                </p>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Site Origin</th>
                        <th>Collected Weight</th>
                        <th>Waste Type</th>
                        <th>Date Collected</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectedWasteQueue.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            All collected waste loads have been dispatched to factories.
                          </td>
                        </tr>
                      ) : (
                        collectedWasteQueue.map(item => (
                          <tr key={item.id}>
                            <td><strong>{item.id}</strong></td>
                            <td><strong>{item.site}</strong></td>
                            <td><strong style={{ color: 'var(--gold-light)' }}>{item.weightKg} kg</strong></td>
                            <td>{item.wasteType}</td>
                            <td>{item.collectedDate}</td>
                            <td>
                              <button className="action-btn approve" onClick={() => handleAssignLogistics(item.id)}>
                                Assign Logistics Partner
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 3: CARBON CREDIT MINTING
            --------------------------------------------------------------------- */}
        {activeSubTab === 'carbon' && (
          <div className="mgmt-sub-view active">
            <div className="mgmt-grid-1col">
              <div className="glass-panel table-panel">
                <h3>Tested Batches Awaiting Carbon Tokenization</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Batches processed through composting and attested by soil science laboratory. Minting locks carbon avoidance credits on registry.
                </p>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Batch ID</th>
                        <th>Batch Name</th>
                        <th>Compost Yield</th>
                        <th>CO2e Offset (Est)</th>
                        <th>Lab Test Parameters</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchesAwaitingCert.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No compost batches awaiting certification.
                          </td>
                        </tr>
                      ) : (
                        batchesAwaitingCert.map(batch => (
                          <tr key={batch.id}>
                            <td><strong>{batch.id}</strong></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{batch.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Harvested: {batch.harvestDate}</div>
                            </td>
                            <td>{batch.compostYieldKg} kg</td>
                            <td><strong style={{ color: 'var(--gold-light)' }}>{batch.carbonOffsetValueMt} MT CO2e</strong></td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Score: {batch.qaScore}/100</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NPK: {batch.npkRatio} | pH: {batch.ph}</div>
                            </td>
                            <td>
                              <button className="action-btn approve" onClick={() => handleCertifyCarbon(batch.id)}>
                                Certify & Mint Credits
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 5: FACTORY PERFORMANCE REPORTS
            --------------------------------------------------------------------- */}
        {activeSubTab === 'factory' && (
          <div className="mgmt-sub-view active">
            <div className="mgmt-grid-1col">
              <div className="glass-panel table-panel">
                <div className="flex-between mb-15">
                  <div>
                    <h3>Factory Recycling & Carbon Report</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Track compost processing volumes, recovered plastics, and carbon offsets per partner factory.
                    </p>
                  </div>
                  <div>
                    <select 
                      className="login-input" 
                      value={factoryPeriod} 
                      onChange={(e) => setFactoryPeriod(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                    >
                      <option value="weekly">Weekly Reports</option>
                      <option value="monthly">Monthly Reports</option>
                    </select>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Factory ID</th>
                        <th>Processing Facility Name</th>
                        <th>Waste Repurposed ({factoryPeriod})</th>
                        <th>Plastics Diverted</th>
                        <th>Verified Carbon Saved</th>
                        <th>QA Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FACTORY_REPORTS[factoryPeriod].map(fac => (
                        <tr key={fac.id}>
                          <td><strong>{fac.id}</strong></td>
                          <td><strong>{fac.name}</strong></td>
                          <td><strong style={{ color: 'var(--primary)' }}>{fac.recycledKg} kg</strong></td>
                          <td>{fac.plasticRecoveredKg} kg</td>
                          <td><strong style={{ color: 'var(--primary)' }}>{fac.carbonSavedMt} MT CO2e</strong></td>
                          <td><span className="status-pill approved">★ {fac.rating}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 6: ACTIVE CONTRACTS LEDGER
            --------------------------------------------------------------------- */}
        {activeSubTab === 'sites' && (
          <div className="mgmt-sub-view active">
            <div className="mgmt-grid-2col">
              <div className="glass-panel table-panel">
                <h3>Active Client Agreements</h3>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Site ID</th>
                        <th>Client / Organization</th>
                        <th>Provisioned Bins</th>
                        <th>Sort Accuracy</th>
                        <th>Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSites.map(site => (
                        <tr key={site.id}>
                          <td><strong>{site.id}</strong></td>
                          <td><strong>{site.name}</strong></td>
                          <td>{site.bins} Smart Bins</td>
                          <td>
                            <strong style={{ color: 'var(--success)' }}>
                              {site.sortAccuracy}%
                            </strong>
                          </td>
                          <td>
                            <span className="status-pill approved">
                              {site.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic weekly recycling index chart mockup */}
              <div className="glass-panel">
                <h3>Sector Target Index</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Aggregated recycling efficiency over the last 4 periods.
                </p>
                <div className="chart-sim-wrapper">
                  <div className="chart-bar" style={{ height: '62%' }} data-val="62%"></div>
                  <div className="chart-bar" style={{ height: '74%' }} data-val="74%"></div>
                  <div className="chart-bar" style={{ height: '85%' }} data-val="85%"></div>
                  <div className="chart-bar" style={{ height: '94%', background: 'linear-gradient(to top, var(--primary), var(--primary-glow))' }} data-val="94%"></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  <span>WEEK 1</span>
                  <span>WEEK 2</span>
                  <span>WEEK 3</span>
                  <span>WEEK 4 (CURR)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            LOGS PANEL (ACTION AUDITS)
            ========================================================================= */}
        <div className="glass-panel mt-20 table-panel logs-panel">
          <h3>Management Action Audits</h3>
          <div className="logs-container">
            {logs.map((log, idx) => (
              <div className="log-row" key={idx}>
                <span className={`log-badge ${log.category.toLowerCase()}`}>{log.category}</span>
                <div className="log-text-content">
                  <div className="log-message">{log.message}</div>
                  <div className="log-time">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL 1: ASSIGN TECHNICIAN CREW OVERLAY
          ========================================================================= */}
      {showTechModal && (
        <div className="login-gate" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px' }}>Assign Technician Crew</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Select a field engineering crew to dispatch and install the requested smart bins.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {TECH_CREWS.map(crew => (
                <div 
                  key={crew.id} 
                  className="glass-card-interactive"
                  onClick={() => confirmApproveReq(crew)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#fff' }}>{crew.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lead: {crew.lead}</p>
                  </div>
                  <span className="status-pill approved" style={{ fontSize: '10px' }}>
                    {crew.strength}
                  </span>
                </div>
              ))}
            </div>

            <button 
              className="guest-bypass-btn" 
              onClick={() => { setShowTechModal(false); }}
              style={{ width: '100%', marginTop: '20px', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              Cancel Approval
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ASSIGN LOGISTICS PARTNER OVERLAY
          ========================================================================= */}
      {showLogisticsModal && (
        <div className="login-gate" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px' }}>Assign Logistics Carrier</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Select a transport service partner to haul collected waste directly to compost processing factories.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LOGISTICS_PARTNERS.map(partner => (
                <div 
                  key={partner.id} 
                  className="glass-card-interactive"
                  onClick={() => confirmAssignLogistics(partner)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#fff' }}>{partner.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fleet: {partner.fleet} | contact: {partner.contact}</p>
                  </div>
                  <span className="status-pill approved" style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    {partner.rate}
                  </span>
                </div>
              ))}
            </div>

            <button 
              className="guest-bypass-btn" 
              onClick={() => { setShowLogisticsModal(false); }}
              style={{ width: '100%', marginTop: '20px', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              Cancel Dispatch
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
