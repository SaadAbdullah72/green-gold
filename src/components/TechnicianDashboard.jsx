import React, { useMemo, useState } from 'react';
import { TECHNICAL_STAFF_DATA } from '../mockData';
import { 
  IconDashboard, IconTruck, IconBox, IconPlus, 
  IconSettings, IconLab, IconChart, IconBell, IconUser 
} from './Icons';

const navItems = [
  { id: 'dashboard', label: 'Dashboard Home', icon: <IconDashboard size={18} /> },
  { id: 'jobs', label: 'Assigned Jobs', icon: <IconTruck size={18} /> },
  { id: 'inventory', label: 'Smart Bin Inventory', icon: <IconBox size={18} /> },
  { id: 'installs', label: 'Installation Requests', icon: <IconPlus size={18} /> },
  { id: 'maintenance', label: 'Maintenance', icon: <IconSettings size={18} /> },
  { id: 'diagnostics', label: 'Diagnostics', icon: <IconLab size={18} /> },
  { id: 'calibration', label: 'Calibration', icon: <IconChart size={18} /> },
  { id: 'orders', label: 'Work Orders', icon: <IconBox size={18} /> },
  { id: 'parts', label: 'Spare Parts', icon: <IconBox size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <IconBell size={18} /> },
  { id: 'profile', label: 'Profile & Settings', icon: <IconUser size={18} /> }
];


export default function TechnicianDashboard({ onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [jobs, setJobs] = useState(TECHNICAL_STAFF_DATA.jobs);
  const [inventory, setInventory] = useState(TECHNICAL_STAFF_DATA.inventory);
  const [installRequests, setInstallRequests] = useState(TECHNICAL_STAFF_DATA.installRequests);
  const [maintenanceTasks, setMaintenanceTasks] = useState(TECHNICAL_STAFF_DATA.maintenanceTasks);
  const [workOrders, setWorkOrders] = useState(TECHNICAL_STAFF_DATA.workOrders);
  const [parts, setParts] = useState(TECHNICAL_STAFF_DATA.parts);
  const [notifications] = useState(TECHNICAL_STAFF_DATA.notifications);
  const [selectedJobId, setSelectedJobId] = useState(TECHNICAL_STAFF_DATA.jobs[0]?.id ?? null);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || jobs[0], [jobs, selectedJobId]);

  const handleJobAction = (jobId, action) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        const nextStatus = action === 'Complete' ? 'Completed' : action === 'Pause' ? 'Paused' : action === 'Accept' ? 'In Progress' : job.status;
        return { ...job, status: nextStatus, lastAction: action };
      })
    );
    setSelectedJobId(jobId);
  };

  const handleInstallAction = (id) => {
    setInstallRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Accepted' } : item)));
  };

  const handleMaintenanceAction = (id) => {
    setMaintenanceTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'In Progress' } : item)));
  };

  const handlePartRequest = (id) => {
    setParts((prev) => prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock - 1), status: item.stock > 1 ? 'Request Sent' : 'Low Stock' } : item)));
  };

  const initials = 'TS';

  return (
    <div className="app-container">
      <aside className="sidebar-left">
        <div className="app-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
          </div>
          <div className="logo-text">
            <h1>GreenGoldOS</h1>
            <span>Technical Bins Staff</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
          <div>
            <h4 className="menu-label">Field Ops</h4>
            <ul className="menu-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button className={`menu-btn ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>
                    <span className="menu-btn-content">
                      <span style={{ width: '18px', display: 'inline-flex', justifyContent: 'center' }}>{item.icon}</span>
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card" onClick={onLogout} style={{ cursor: 'pointer' }} title="Click to log out">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <span className="name">Field Crew Lead</span>
              <span className="role" style={{ color: 'var(--gold-light)', fontWeight: '600' }}>Logout ⮞</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="view-header">
          <div>
            <h2>Field Operations Command Center</h2>
            <p>Install, inspect, calibrate, and maintain smart bins with full telemetry visibility.</p>
          </div>
          <div>
            <span className="status-pill approved" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '700' }}>
              Crew Online
            </span>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Assigned Jobs</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M8 11h8"></path><path d="M8 16h5"></path></svg>
            </div>
            <div className="kpi-value">{jobs.length}</div>
            <div className="kpi-label">Current field assignments</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Pending Installs</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18"></path><path d="M3 12h18"></path></svg>
            </div>
            <div className="kpi-value">{installRequests.filter((item) => item.status === 'Pending').length}</div>
            <div className="kpi-label">Awaiting crew acceptance</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Completed Today</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
            </div>
            <div className="kpi-value">{jobs.filter((job) => job.status === 'Completed').length}</div>
            <div className="kpi-label">Closed service events</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">
              <span>Offline Bins</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div className="kpi-value">{inventory.filter((bin) => bin.connectivity === 'Offline').length}</div>
            <div className="kpi-label">Require field recovery</div>
          </div>
        </div>

        {activeView === 'dashboard' && (
          <div className="mgmt-sub-view active" style={{ display: 'grid', gap: '24px' }}>
            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3>Assigned Jobs & Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '20px' }}>
                <div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Job</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} onClick={() => setSelectedJobId(job.id)} style={{ cursor: 'pointer' }}>
                          <td>
                            <strong>{job.id}</strong>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.org}</div>
                          </td>
                          <td>{job.priority}</td>
                          <td>{job.status}</td>
                          <td>
                            <button className="action-btn approve" onClick={(e) => { e.stopPropagation(); handleJobAction(job.id, 'Accept'); }}>
                              Accept
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '700' }}>Live Job Detail</h4>
                  {selectedJob ? (
                    <>
                      <p style={{ marginBottom: '8px', color: 'var(--text-primary)' }}><strong>{selectedJob.id}</strong> · {selectedJob.workflow}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>{selectedJob.description}</p>
                      <div style={{ display: 'grid', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <div><strong>Organization:</strong> {selectedJob.org}</div>
                        <div><strong>Bin:</strong> {selectedJob.binId}</div>
                        <div><strong>GPS:</strong> {selectedJob.gps}</div>
                        <div><strong>Schedule:</strong> {selectedJob.schedule}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                        <button className="action-btn approve" onClick={() => handleJobAction(selectedJob.id, 'Start')}>Start</button>
                        <button className="action-btn approve" onClick={() => handleJobAction(selectedJob.id, 'Pause')}>Pause</button>
                        <button className="action-btn approve" onClick={() => handleJobAction(selectedJob.id, 'Complete')}>Complete</button>
                        <button className="action-btn deny" onClick={() => handleJobAction(selectedJob.id, 'Issue')}>Report Issue</button>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>No active assignment selected.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map((item) => (
                  <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <span className={`status-pill ${item.severity === 'critical' ? 'warning' : 'approved'}`} style={{ fontSize: '10px' }}>{item.severity}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'jobs' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Assigned Jobs & Details</h3>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Organization</th>
                      <th>Priority</th>
                      <th>Bin</th>
                      <th>GPS / Schedule</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td><strong>{job.id}</strong></td>
                        <td>{job.org}</td>
                        <td>{job.priority}</td>
                        <td>{job.binId}</td>
                        <td>{job.gps} · {job.schedule}</td>
                        <td>{job.status}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button className="action-btn approve" onClick={() => handleJobAction(job.id, 'Accept')}>Accept</button>
                            <button className="action-btn approve" onClick={() => handleJobAction(job.id, 'Start')}>Start</button>
                            <button className="action-btn approve" onClick={() => handleJobAction(job.id, 'Complete')}>Complete</button>
                            <button className="action-btn deny" onClick={() => handleJobAction(job.id, 'Issue')}>Issue</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'inventory' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Smart Bin Inventory</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bin ID</th>
                    <th>QR / RFID</th>
                    <th>Facility</th>
                    <th>Battery / Signal</th>
                    <th>Health / Connectivity</th>
                    <th>Firmware</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((bin) => (
                    <tr key={bin.id}>
                      <td><strong>{bin.id}</strong><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bin.organization}</div></td>
                      <td>{bin.qr} · {bin.rfid}</td>
                      <td>{bin.facility}</td>
                      <td>{bin.battery}% · {bin.signal}%</td>
                      <td>{bin.health} · {bin.connectivity}</td>
                      <td>{bin.firmware}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'installs' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Installation Requests</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Org</th>
                    <th>Workflow</th>
                    <th>Schedule</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installRequests.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.id}</strong></td>
                      <td>{item.org}</td>
                      <td>{item.workflow}</td>
                      <td>{item.schedule}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`status-pill ${item.status === 'Pending' ? 'warning' : 'approved'}`}>{item.status}</span>
                          <button className="action-btn approve" onClick={() => handleInstallAction(item.id)}>Advance</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'maintenance' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Maintenance Workflow</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Bin</th>
                    <th>Issue</th>
                    <th>Schedule</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceTasks.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.id}</strong></td>
                      <td>{item.binId}</td>
                      <td>{item.issue}</td>
                      <td>{item.schedule}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`status-pill ${item.status === 'Pending' ? 'warning' : 'approved'}`}>{item.status}</span>
                          <button className="action-btn approve" onClick={() => handleMaintenanceAction(item.id)}>Start</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'diagnostics' && (
          <div className="mgmt-sub-view active" style={{ display: 'grid', gap: '24px' }}>
            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>Diagnostics & Telemetry</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Battery', value: '88%', tone: '#D97706' },
                  { label: 'Signal', value: '82%', tone: '#059669' },
                  { label: 'Weight Sensor', value: 'Stable', tone: '#059669' },
                  { label: 'Fill Level', value: '63%', tone: '#2563EB' },
                  { label: 'Temperature', value: '24°C', tone: '#0F172A' },
                  { label: 'Humidity', value: '58%', tone: '#059669' }
                ].map((metric) => (
                  <div key={metric.label} className="soft-card" style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', background: '#F8FAFC', margin: 0 }}>
                    <span className="pill-badge" style={{ fontSize: '10.5px', marginBottom: '8px' }}>{metric.label}</span>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: metric.tone, marginTop: '6px' }}>{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '800' }}>Firmware & Health</h3>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Firmware:</span> <strong>v3.4.1</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Overall health score:</span> <strong style={{ color: '#059669' }}>93%</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Connectivity:</span> <strong style={{ color: '#2563EB' }}>Stable, strong uplink</strong></div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'calibration' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Calibration & Sensor Monitoring</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Reading</th>
                    <th>Calibration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Weight Sensor</td>
                    <td>63kg</td>
                    <td>Offset +1.3%</td>
                    <td><span className="status-pill approved">Calibrated</span></td>
                  </tr>
                  <tr>
                    <td>Fill Level</td>
                    <td>68%</td>
                    <td>Baseline synced</td>
                    <td><span className="status-pill approved">Stable</span></td>
                  </tr>
                  <tr>
                    <td>Temperature</td>
                    <td>24°C</td>
                    <td>Auto-corrected</td>
                    <td><span className="status-pill warning">Monitor</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'orders' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Work Orders & Service History</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tech</th>
                    <th>Issue</th>
                    <th>Action / Parts</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.date}</td>
                      <td>{order.tech}</td>
                      <td>{order.issue}</td>
                      <td>{order.action} · {order.parts}</td>
                      <td>{order.duration}</td>
                      <td><span className="status-pill approved">{order.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'parts' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel">
              <h3>Spare Parts & Replacement Requests</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Stock</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.stock}</td>
                      <td>{item.location}</td>
                      <td>{item.status}</td>
                      <td><button className="action-btn approve" onClick={() => handlePartRequest(item.id)}>Request</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'notifications' && (
          <div className="mgmt-sub-view active">
            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '20px' }}>Operational Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {notifications.map((item) => (
                  <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{item.title}</strong>
                      <span className={`status-pill ${item.severity === 'critical' ? 'warning' : 'approved'}`} style={{ fontSize: '11px' }}>{item.severity}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px', lineHeight: '1.5' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'profile' && (
          <div className="mgmt-sub-view active" style={{ display: 'grid', gap: '24px' }}>
            <div className="glass-panel table-panel" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '20px' }}>Profile & Settings</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>CREW LEAD</label>
                  <input className="login-input" value="Alex Mercer" readOnly style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>PRIMARY ZONE</label>
                  <input className="login-input" value="North Area" readOnly style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>MOBILE SYNC</label>
                  <input className="login-input" value="Enabled · Offline sync queued" readOnly style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
