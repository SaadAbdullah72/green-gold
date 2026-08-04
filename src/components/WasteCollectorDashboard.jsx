import React, { useState } from 'react';

/**
 * WasteCollectorDashboard Component
 * 
 * Provides an operational dashboard for the Waste Collector Staff (Driver/Logistics).
 * Features:
 * 1. Sidebar Navigation: Overview, Tasks, Route, Bins, History, Performance, Notifications, Profile.
 * 2. Home/Overview: Shift control, today's progress bar, "Next Up" task action card.
 * 3. Tasks List: Filterable by status, priority, and waste type.
 * 4. Task Details: Operational stepper flow (Assigned -> En Route -> Arrived -> Collecting -> Completed/Skipped).
 * 5. Complete Collection Form Modal: Custom actual quantity inputs, notes, mock camera uploads, and double confirmation.
 * 6. Issue Reporting Form Modal: Allows reporting bin damage, Wrong Waste Type, Blocks, etc.
 * 7. Route View: Timeline sequence and custom SVG grid mockup route map showing trucks moving through nodes.
 * 8. Collection Points: Live mock telemetry gauges with colored fill levels.
 * 9. History: Log of today's completed/skipped items.
 * 10. Performance: Weekly stats and custom CSS visual charts.
 * 11. Profile & Shifts: Driver and vehicle info, availability toggle.
 */
export default function WasteCollectorDashboard({
  username,
  onLogout,
  tasks,
  notifications,
  performance,
  shift,
  onUpdateTaskStatus,
  onCompleteCollection,
  onReportIssue,
  onToggleShiftStatus,
  onClearNotification
}) {
  const [activeTab, setActiveTab] = useState('overview'); // tabs: overview, tasks, route, bins, history, performance, notifications, profile
  const [selectedTask, setSelectedTask] = useState(null); // for task details modal
  const [showCompleteModal, setShowCompleteModal] = useState(false); // completion form
  const [showIssueModal, setShowIssueModal] = useState(false); // issue form
  const [taskForAction, setTaskForAction] = useState(null); // target task for complete/issue

  // Complete Form States
  const [actualQty, setActualQty] = useState('');
  const [notes, setNotes] = useState('');
  const [wasteType, setWasteType] = useState('Organic Food Waste');
  const [reportIssueInComplete, setReportIssueInComplete] = useState(false);
  const [completeConfirmation, setCompleteConfirmation] = useState(false);

  // Issue Form States
  const [issueType, setIssueType] = useState('Bin damaged');
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePriority, setIssuePriority] = useState('High');

  // Tasks Filter States
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterWaste, setFilterWaste] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract initials for profile avatar
  const initials = username.split(/[ _]/).map(w => w[0]).join("").toUpperCase().substring(0, 2);

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.collectionPoint.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.binId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesPriority = filterPriority === 'all' || t.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchesWaste = filterWaste === 'all' || t.wasteType.toLowerCase().includes(filterWaste.toLowerCase());
    return matchesSearch && matchesStatus && matchesPriority && matchesWaste;
  });

  // Today's Stats
  const completedToday = tasks.filter(t => t.status === 'Completed').length;
  const skippedToday = tasks.filter(t => t.status === 'Skipped' || t.status === 'Failed').length;
  const remainingToday = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Skipped' && t.status !== 'Failed').length;
  const totalToday = tasks.length;
  const completionProgress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Find next up task (the first non-completed/non-skipped task)
  const nextTask = tasks.find(t => t.status !== 'Completed' && t.status !== 'Skipped' && t.status !== 'Failed');

  // Handle open details modal
  const openTaskDetails = (task) => {
    setSelectedTask(task);
  };

  // Stepper state triggers
  const triggerStatusUpdate = (taskId, newStatus) => {
    onUpdateTaskStatus(taskId, newStatus);
    // Sync active details task view if open
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleStartCompleteModal = (task) => {
    setTaskForAction(task);
    setActualQty(task.estQuantity || '');
    setWasteType(task.wasteType);
    setNotes('');
    setReportIssueInComplete(false);
    setCompleteConfirmation(false);
    setShowCompleteModal(true);
  };

  const submitCompleteCollection = () => {
    if (!completeConfirmation) {
      setCompleteConfirmation(true);
      return;
    }
    onCompleteCollection(taskForAction.id, {
      actualQuantity: parseFloat(actualQty) || taskForAction.estQuantity,
      wasteType,
      notes,
      reportedIssue: reportIssueInComplete ? "Contamination / Placement Issue Reported on collection" : null
    });
    setShowCompleteModal(false);
    setCompleteConfirmation(false);
    setTaskForAction(null);
    // Sync detail modal if open
    if (selectedTask && selectedTask.id === taskForAction.id) {
      setSelectedTask(null); // close detail modal or reset
    }
  };

  const handleStartIssueModal = (task) => {
    setTaskForAction(task);
    setIssueType('Bin damaged');
    setIssueDesc('');
    setIssuePriority('High');
    setShowIssueModal(true);
  };

  const submitReportIssue = () => {
    onReportIssue(taskForAction.id, {
      issueType,
      description: issueDesc,
      priority: issuePriority
    });
    setShowIssueModal(false);
    setTaskForAction(null);
    if (selectedTask && selectedTask.id === taskForAction.id) {
      setSelectedTask(prev => ({ ...prev, status: 'Reported Issue' }));
    }
  };

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
            <span>Collector Portal</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          <h4 className="menu-label">Main Menu</h4>
          <ul className="menu-list">
            <li>
              <button className={`menu-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                  Dashboard
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  My Tasks
                  {remainingToday > 0 && <span className="badge-counter" style={{ marginLeft: 'auto' }}>{remainingToday}</span>}
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'route' ? 'active' : ''}`} onClick={() => setActiveTab('route')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                  My Route
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'bins' ? 'active' : ''}`} onClick={() => setActiveTab('bins')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  Collection Bins
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  History
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  Performance
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="badge-counter" style={{ marginLeft: 'auto' }}>{notifications.filter(n => !n.read).length}</span>
                  )}
                </span>
              </button>
            </li>
            <li>
              <button className={`menu-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <span className="menu-btn-content">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Profile / Shift
                </span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Profile Card Footer */}
        <div className="sidebar-footer">
          <div className="profile-card" onClick={onLogout} style={{ cursor: 'pointer' }} title="Click to log out">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <span className="name">{shift.driverName}</span>
              <span className="role" style={{ color: 'var(--gold-light)', fontWeight: '600' }}>Logout ⮞</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN COMMAND CENTER CONTENT
          ========================================================================= */}
      <main className="main-content">
        
        {/* Header with Shift Status Indicator */}
        <div className="view-header">
          <div>
            <h2>GreenGoldOS — Collector Console</h2>
            <p>Smart logistics field operations portal</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="login-input"
              value={shift.availabilityStatus}
              onChange={(e) => onToggleShiftStatus(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '12.5px',
                background: shift.availabilityStatus === 'On Duty' ? 'rgba(16, 185, 129, 0.15)' : shift.availabilityStatus === 'On Break' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: shift.availabilityStatus === 'On Duty' ? 'var(--primary)' : shift.availabilityStatus === 'On Break' ? 'var(--gold-light)' : 'var(--danger)',
                borderColor: shift.availabilityStatus === 'On Duty' ? 'var(--primary)' : shift.availabilityStatus === 'On Break' ? 'var(--gold-light)' : 'var(--danger)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <option value="On Duty">🟢 On Duty</option>
              <option value="On Break">🟡 On Break</option>
              <option value="Off Duty">🔴 Off Duty</option>
            </select>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            TAB VIEW 1: OVERVIEW / DASHBOARD
            --------------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="mgmt-sub-view">
            
            {/* Shift banner warning if on Break or Off Duty */}
            {shift.availabilityStatus !== 'On Duty' && (
              <div className="glass-panel" style={{ borderLeft: '4px solid var(--gold-light)', padding: '15px 25px', marginBottom: '25px', background: 'rgba(251, 191, 36, 0.05)' }}>
                <p style={{ color: 'var(--gold-light)', fontSize: '13.5px', fontWeight: '600' }}>
                  ⚠️ You are currently <strong>{shift.availabilityStatus}</strong>. Put status back to "On Duty" when ready to receive dispatches.
                </p>
              </div>
            )}

            {/* Today's Collection Metrics */}
            <div className="kpi-grid">
              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--primary)' }}>
                <div className="kpi-title">
                  <span>Assigned Today</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--primary)" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                </div>
                <div className="kpi-value">{totalToday}</div>
                <div className="kpi-label">Pickup points scheduled</div>
              </div>

              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--gold-light)' }}>
                <div className="kpi-title">
                  <span>Completed Today</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--gold-light)" strokeWidth="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div className="kpi-value">{completedToday}</div>
                <div className="kpi-label">Diverted waste loads saved</div>
              </div>

              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--text-dark)' }}>
                <div className="kpi-title">
                  <span>Pending Collections</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--text-dark)" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="kpi-value">{remainingToday}</div>
                <div className="kpi-label">Stops remaining in route</div>
              </div>
            </div>

            {/* Progress Bar Panel */}
            <div className="glass-panel" style={{ padding: '25px', marginBottom: '35px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>
                <span>Route Completion Progress</span>
                <span style={{ color: 'var(--gold-light)' }}>{completionProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${completionProgress}%`, height: '100%', background: 'linear-gradient(95deg, var(--primary), var(--gold-light))', borderRadius: '20px', transition: 'var(--transition)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Shift Started at 06:00 AM</span>
                <span>{completedToday} of {totalToday} Stops Completed</span>
              </div>
            </div>

            {/* Next Task Detail / Empty State */}
            <div className="mgmt-grid-2col" style={{ gap: '25px' }}>
              {/* Left Column: Next Collection Task */}
              <div className="glass-panel" style={{ border: '1px solid var(--border-highlight)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--gold-light)' }}>📍 Next Collection Point</h3>
                  {nextTask && (
                    <span className={`status-pill ${nextTask.priority === 'High' ? 'deny' : nextTask.priority === 'Medium' ? 'warning' : 'approved'}`} style={{ textTransform: 'uppercase' }}>
                      {nextTask.priority} Priority
                    </span>
                  )}
                </div>

                {nextTask ? (
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700', letterSpacing: '0.08em' }}>Establishment Name</span>
                      <h4 style={{ fontSize: '20px', color: '#fff', marginTop: '2px' }}>{nextTask.collectionPoint}</h4>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>{nextTask.location}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', background: 'rgba(0,0,0,0.25)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Smart Bin Reference</span>
                        <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: '700', marginTop: '2px' }}>{nextTask.binId}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Scheduled Time</span>
                        <div style={{ fontSize: '13.5px', color: 'var(--gold-light)', fontWeight: '700', marginTop: '2px' }}>{nextTask.scheduledTime}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Expected Weight</span>
                        <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: '700', marginTop: '2px' }}>{nextTask.estQuantity} kg</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Telemetry level</span>
                        <div style={{ fontSize: '13.5px', color: nextTask.fillLevel >= 100 ? 'var(--danger)' : nextTask.fillLevel >= 90 ? 'var(--warning)' : 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
                          {nextTask.fillLevel}% (Full)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Operational Pipeline Status</span>
                      
                      {/* Interactive Pipeline State Buttons */}
                      {nextTask.status === 'Assigned' && (
                        <button className="login-btn" style={{ width: '100%', marginTop: 0 }} onClick={() => triggerStatusUpdate(nextTask.id, 'En Route')}>
                          🚚 Start Task (Mark En Route)
                        </button>
                      )}
                      
                      {nextTask.status === 'En Route' && (
                        <button className="login-btn" style={{ width: '100%', marginTop: 0, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))' }} onClick={() => triggerStatusUpdate(nextTask.id, 'Arrived')}>
                          📍 Mark Arrived at Location
                        </button>
                      )}

                      {nextTask.status === 'Arrived' && (
                        <button className="login-btn" style={{ width: '100%', marginTop: 0, background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} onClick={() => triggerStatusUpdate(nextTask.id, 'Collecting')}>
                          ⚡ Start Bin Emptying Handshake
                        </button>
                      )}

                      {nextTask.status === 'Collecting' && (
                        <button className="login-btn" style={{ width: '100%', marginTop: 0 }} onClick={() => handleStartCompleteModal(nextTask)}>
                          ⚖️ Record Weight & Complete Collection
                        </button>
                      )}

                      {nextTask.status === 'Reported Issue' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="login-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => triggerStatusUpdate(nextTask.id, 'Collecting')}>
                            Resume Collection
                          </button>
                          <button className="action-btn deny" style={{ flex: 1 }} onClick={() => triggerStatusUpdate(nextTask.id, 'Skipped')}>
                            Skip / Abort Stop
                          </button>
                        </div>
                      )}

                      {/* Small auxiliary buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button className="guest-bypass-btn" style={{ flex: 1, marginTop: '0' }} onClick={() => openTaskDetails(nextTask)}>
                          📝 Read Instructions
                        </button>
                        {nextTask.status !== 'Completed' && nextTask.status !== 'Skipped' && nextTask.status !== 'Failed' && (
                          <button className="guest-bypass-btn" style={{ flex: 1, marginTop: '0', color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.4)' }} onClick={() => handleStartIssueModal(nextTask)}>
                            ⚠️ Report Issue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>🎉 All tasks finished!</p>
                    <p style={{ fontSize: '13px' }}>You have completed all scheduled pickups for this shift.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Mini Map Route Visualizer & Info */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '15px' }}>🗺️ Route Visual Overview</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Your scheduled collection route today (Downtown Zone Alpha).
                </p>

                {/* Simulated route tracker SVG */}
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', borderRadius: '8px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 160">
                    {/* Grid backing lines */}
                    <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(16,185,129,0.05)" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(16,185,129,0.05)" />
                    <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(16,185,129,0.05)" />
                    <line x1="100" y1="0" x2="100" y2="160" stroke="rgba(16,185,129,0.05)" />
                    <line x1="200" y1="0" x2="200" y2="160" stroke="rgba(16,185,129,0.05)" />
                    <line x1="300" y1="0" x2="300" y2="160" stroke="rgba(16,185,129,0.05)" />

                    {/* Path line */}
                    <path d="M 50 80 Q 120 30 180 80 T 320 80" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="4" strokeDasharray="5" />
                    
                    {/* Node points */}
                    <circle cx="50" cy="80" r="10" fill="var(--success)" stroke="#fff" strokeWidth="2" title="Stop 1" />
                    <text x="50" y="62" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">S1</text>

                    <circle cx="120" cy="55" r="10" fill={tasks[1]?.status === 'Completed' ? 'var(--success)' : 'var(--gold)'} stroke="#fff" strokeWidth="2" title="Stop 2" />
                    <text x="120" y="38" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">S2</text>

                    <circle cx="180" cy="80" r="10" fill={tasks[2]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.1)'} stroke="#fff" strokeWidth="1" title="Stop 3" />
                    <text x="180" y="62" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">S3</text>

                    <circle cx="250" cy="105" r="10" fill={tasks[3]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.1)'} stroke="#fff" strokeWidth="1" title="Stop 4" />
                    <text x="250" y="125" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">S4</text>

                    <circle cx="320" cy="80" r="10" fill={tasks[4]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.1)'} stroke="#fff" strokeWidth="1" title="Stop 5" />
                    <text x="320" y="62" fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">S5</text>

                    {/* Vehicle Truck Icon */}
                    {nextTask && (
                      <g transform={nextTask.stopNumber === 2 ? "translate(108, 43)" : nextTask.stopNumber === 3 ? "translate(168, 68)" : nextTask.stopNumber === 4 ? "translate(238, 93)" : "translate(308, 68)"}>
                        <rect x="0" y="0" width="24" height="14" rx="2" fill="var(--gold-light)" />
                        <rect x="18" y="2" width="6" height="10" rx="1" fill="#000" />
                        <circle cx="6" cy="14" r="3" fill="#fff" />
                        <circle cx="18" cy="14" r="3" fill="#fff" />
                      </g>
                    )}
                  </svg>
                  
                  <span style={{ position: 'absolute', bottom: '6px', left: '10px', fontSize: '9px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                    GPS Route Track Mockup (Leaflet.js Hook Available)
                  </span>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <button className="guest-bypass-btn" style={{ width: '100%', marginTop: '0' }} onClick={() => setActiveTab('route')}>
                    🔍 View Detailed Navigation Map
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Helper Info */}
            <div className="glass-panel" style={{ marginTop: '25px', padding: '20px 30px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>💡 Quick Tips For Field Operators</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Ensure your vehicle scale is calibrated before entering the weight details. Use the "Report Issue" button immediately if the smart bin is blocked by vehicles or has wrong materials (plastics/metal) inside organic waste compartments.
              </p>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 2: MY TASKS (FILTERABLE LIST)
            --------------------------------------------------------------------- */}
        {activeTab === 'tasks' && (
          <div className="mgmt-sub-view">
            
            {/* Filters Bar */}
            <div className="glass-panel" style={{ padding: '20px 25px', marginBottom: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'center' }}>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Search Point</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Search name, bin ID, area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px' }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Status</label>
                  <select
                    className="login-input"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                  >
                    <option value="all">Show All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="en route">En Route</option>
                    <option value="arrived">Arrived</option>
                    <option value="collecting">Collecting</option>
                    <option value="completed">Completed</option>
                    <option value="skipped">Skipped / Failed</option>
                    <option value="reported issue">Reported Issue</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Priority</label>
                  <select
                    className="login-input"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                {/* Waste Type Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Waste Category</label>
                  <select
                    className="login-input"
                    value={filterWaste}
                    onChange={(e) => setFilterWaste(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: '13px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="organic">Organic Waste</option>
                    <option value="recyclables">Recyclables</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Task Table / Cards */}
            <div className="glass-panel table-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Assigned Collection Stops</h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Found {filteredTasks.length} stops matching filters</span>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Stop #</th>
                      <th>Location ID / Client</th>
                      <th>Bin Reference</th>
                      <th>Scheduled</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                          No assigned collection tasks found for today.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t) => (
                        <tr key={t.id}>
                          <td><strong>#{t.stopNumber}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{t.collectionPoint}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.location}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{t.binId}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-dark)' }}>{t.wasteType}</div>
                          </td>
                          <td><strong style={{ color: 'var(--gold-light)' }}>{t.scheduledTime}</strong></td>
                          <td>
                            <span className={`status-pill ${t.priority === 'High' ? 'deny' : t.priority === 'Medium' ? 'warning' : 'approved'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${
                              t.status === 'Completed' ? 'approved' :
                              t.status === 'Assigned' ? 'warning' :
                              t.status === 'Reported Issue' ? 'deny' : 'approved'
                            }`} style={{ background: t.status === 'En Route' || t.status === 'Arrived' || t.status === 'Collecting' ? 'rgba(6, 182, 212, 0.12)' : '', color: t.status === 'En Route' || t.status === 'Arrived' || t.status === 'Collecting' ? '#06b6d4' : '', borderColor: t.status === 'En Route' || t.status === 'Arrived' || t.status === 'Collecting' ? 'rgba(6, 182, 212, 0.2)' : '' }}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn approve" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTaskDetails(t)}>
                              View Details
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
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 3: MY ROUTE & NAVIGATION
            --------------------------------------------------------------------- */}
        {activeTab === 'route' && (
          <div className="mgmt-sub-view">
            
            <div className="mgmt-grid-2col" style={{ gap: '25px' }}>
              
              {/* Map & Timeline Stops */}
              <div className="glass-panel" style={{ flex: 1.2 }}>
                <h3>Route Timeline Map</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Sequential stop coordinates assigned for current vehicle trip.
                </p>

                {/* Vertical timeline of stops */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingLeft: '15px', position: 'relative' }}>
                  
                  {/* Vertical connecting line */}
                  <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '24px', width: '2px', background: 'rgba(16,185,129,0.15)' }}></div>

                  {tasks.map((t, idx) => {
                    const isActive = nextTask && nextTask.id === t.id;
                    const isDone = t.status === 'Completed';
                    const isIssue = t.status === 'Reported Issue';
                    const isSkipped = t.status === 'Skipped' || t.status === 'Failed';

                    return (
                      <div key={t.id} style={{ display: 'flex', gap: '20px', padding: '15px 0', position: 'relative', alignItems: 'flex-start' }}>
                        
                        {/* Circle node index */}
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isDone ? 'var(--success)' : isActive ? 'var(--gold-light)' : isIssue ? 'var(--danger)' : isSkipped ? '#4b5563' : 'rgba(16,185,129,0.05)',
                          border: `2px solid ${isDone ? '#fff' : isActive ? 'var(--gold)' : isIssue ? '#fff' : '#4b5563'}`,
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: '800',
                          color: isDone || isActive || isIssue ? '#000' : 'var(--text-muted)',
                          marginLeft: '15px'
                        }}>
                          {idx + 1}
                        </div>

                        {/* Stop details card */}
                        <div className="glass-card-interactive" style={{ flex: 1, padding: '15px', background: isActive ? 'rgba(251, 191, 36, 0.04)' : 'rgba(0,0,0,0.15)', border: `1px solid ${isActive ? 'var(--border-highlight)' : 'var(--border-color)'}`, borderRadius: '8px' }} onClick={() => openTaskDetails(t)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '15px', color: '#fff' }}>{t.collectionPoint}</h4>
                            <span style={{ fontSize: '11px', color: isDone ? 'var(--primary)' : isActive ? 'var(--gold-light)' : isIssue ? 'var(--danger)' : 'var(--text-muted)' }}>
                              {t.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.location}</p>
                          <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '11px', color: 'var(--text-dark)' }}>
                            <span>Time: <strong>{t.scheduledTime}</strong></span>
                            <span>Est: <strong>{t.estQuantity} kg</strong></span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Large Route Map Mockup */}
              <div className="glass-panel" style={{ flex: 1.5, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3>Street Route Navigator</h3>
                  <span className="status-pill approved" style={{ background: 'rgba(6, 180, 110, 0.1)', color: 'var(--primary)' }}>GPS Active</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Realtime route navigation simulation. Connects directly to Google Maps / Leaflet API.
                </p>

                {/* Beautiful Mock Map Canvas */}
                <div style={{ flex: 1, background: '#08100c', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
                  
                  {/* Mock map roads background visual using SVG */}
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* Grid roads */}
                    <path d="M 0 40 L 500 40 M 0 100 L 500 100 M 0 180 L 500 180 M 0 260 L 500 260" stroke="rgba(255,255,255,0.06)" strokeWidth="15" fill="none" />
                    <path d="M 60 0 L 60 400 M 160 0 L 160 400 M 260 0 L 260 400 M 360 0 L 360 400" stroke="rgba(255,255,255,0.06)" strokeWidth="15" fill="none" />

                    <path d="M 0 40 L 500 40 M 0 100 L 500 100 M 0 180 L 500 180 M 0 260 L 500 260" stroke="rgba(16,185,129,0.04)" strokeWidth="2" fill="none" />
                    <path d="M 60 0 L 60 400 M 160 0 L 160 400 M 260 0 L 260 400 M 360 0 L 360 400" stroke="rgba(16,185,129,0.04)" strokeWidth="2" fill="none" />

                    {/* Route line highlights */}
                    <path d="M 60 40 L 160 40 L 160 100 L 260 100 L 260 260 L 360 260" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

                    {/* Route stops as labeled map pins */}
                    {/* Stop 1 */}
                    <g transform="translate(60, 40)">
                      <circle cx="0" cy="0" r="10" fill="var(--success)" stroke="#fff" strokeWidth="2" />
                      <text x="0" y="22" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">Marriott</text>
                    </g>

                    {/* Stop 2 */}
                    <g transform="translate(160, 40)">
                      <circle cx="0" cy="0" r="10" fill={tasks[1]?.status === 'Completed' ? 'var(--success)' : 'var(--gold-light)'} stroke="#fff" strokeWidth="2" />
                      <text x="0" y="22" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">Sector 7</text>
                    </g>

                    {/* Stop 3 */}
                    <g transform="translate(160, 100)">
                      <circle cx="0" cy="0" r="10" fill={tasks[2]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.2)'} stroke="#fff" strokeWidth="1" />
                      <text x="0" y="-14" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">College</text>
                    </g>

                    {/* Stop 4 */}
                    <g transform="translate(260, 100)">
                      <circle cx="0" cy="0" r="10" fill={tasks[3]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.2)'} stroke="#fff" strokeWidth="1" />
                      <text x="0" y="22" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">Office Hub</text>
                    </g>

                    {/* Stop 5 */}
                    <g transform="translate(260, 260)">
                      <circle cx="0" cy="0" r="10" fill={tasks[4]?.status === 'Completed' ? 'var(--success)' : 'rgba(255,255,255,0.2)'} stroke="#fff" strokeWidth="1" />
                      <text x="0" y="22" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">Hyatt</text>
                    </g>

                    {/* GPS Active position vehicle indicator */}
                    {nextTask && (
                      <g transform={
                        nextTask.stopNumber === 2 ? "translate(110, 40)" : 
                        nextTask.stopNumber === 3 ? "translate(160, 70)" : 
                        nextTask.stopNumber === 4 ? "translate(210, 100)" : 
                        "translate(260, 180)"
                      }>
                        <circle cx="0" cy="0" r="15" fill="var(--gold-glow)" />
                        <circle cx="0" cy="0" r="6" fill="var(--gold-light)" />
                        <polygon points="-4,-2 0,-8 4,-2" fill="var(--gold-light)" />
                      </g>
                    )}
                  </svg>

                  {/* Top-Right compass overlay card */}
                  <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(10,20,15,0.9)', padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }}>
                    <div style={{ color: 'var(--gold-light)', fontWeight: '700' }}>🗺️ NAVIGATION COMPASS</div>
                    <div style={{ color: '#fff', marginTop: '2px' }}>Next: {nextTask ? nextTask.collectionPoint : "None"}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Estimated travel time: 8 mins</div>
                  </div>

                  {/* Bottom banner overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '10px 15px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 Active Dispatch Route: Downtown Zone A ➔ Compost Yard</span>
                    <button className="action-btn approve" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => alert("Google Maps Navigation launcher is in development mode.")}>
                      Open In Google Maps
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 4: COLLECTION POINTS & TELEMETRY
            --------------------------------------------------------------------- */}
        {activeTab === 'bins' && (
          <div className="mgmt-sub-view">
            
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '25px' }}>
              Real-time telemetry from smart sensors attached to assigned client bins.
            </p>

            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {tasks.map(t => {
                const fillPercent = t.fillLevel;
                // Determine color based on fill level
                const fillCol = fillPercent >= 100 ? 'var(--danger)' : fillPercent >= 90 ? 'var(--warning)' : 'var(--primary)';
                
                return (
                  <div key={t.id} className="glass-panel" style={{ borderLeft: `4px solid ${fillCol}`, padding: '20px 25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '16px' }}>{t.collectionPoint}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>Bin ID: {t.binId}</span>
                      </div>
                      <span className="status-pill" style={{
                        background: t.binStatus === 'Overflowing' || t.binStatus === 'Damaged' ? 'rgba(248, 113, 113, 0.12)' : t.binStatus === 'Full' || t.binStatus === 'Nearly Full' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: t.binStatus === 'Overflowing' || t.binStatus === 'Damaged' ? 'var(--danger)' : t.binStatus === 'Full' || t.binStatus === 'Nearly Full' ? 'var(--gold-light)' : 'var(--primary)',
                        borderColor: t.binStatus === 'Overflowing' || t.binStatus === 'Damaged' ? 'rgba(248, 113, 113, 0.2)' : t.binStatus === 'Full' || t.binStatus === 'Nearly Full' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                      }}>
                        {t.binStatus}
                      </span>
                    </div>

                    {/* Progress Bar for Fill Level */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                        <span>IoT Composter Fill Level</span>
                        <strong style={{ color: fillCol }}>{fillPercent}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: `${Math.min(100, fillPercent)}%`, height: '100%', background: fillCol, borderRadius: '10px' }}></div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
                      <div>Type: <strong>{t.wasteType}</strong></div>
                      <div>Last Collection: <span style={{ color: 'var(--text-main)' }}>{t.lastCollection}</span></div>
                      <div>Expected Load: <span style={{ color: 'var(--gold-light)' }}>{t.estQuantity} kg</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button className="action-btn approve" style={{ flex: 1, fontSize: '11.5px', padding: '6px' }} onClick={() => openTaskDetails(t)}>
                        View Location details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 5: HISTORY
            --------------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="mgmt-sub-view">
            
            <div className="glass-panel table-panel">
              <h3>Today's Collection History Ledger</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Audited list of completed, skipped, or failed stops from the current shift.
              </p>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Collection Site</th>
                      <th>Waste Category</th>
                      <th>Est Weight</th>
                      <th>Collected Weight</th>
                      <th>Operation Status</th>
                      <th>Completed Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(t => t.status === 'Completed' || t.status === 'Skipped' || t.status === 'Failed' || t.status === 'Reported Issue').length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                          No collections logged yet. Complete tasks to see ledger entries.
                        </td>
                      </tr>
                    ) : (
                      tasks.filter(t => t.status === 'Completed' || t.status === 'Skipped' || t.status === 'Failed' || t.status === 'Reported Issue').map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.id}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{t.collectionPoint}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bin: {t.binId}</div>
                          </td>
                          <td>{t.wasteType}</td>
                          <td>{t.estQuantity} kg</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>
                              {t.actualQuantity ? `${t.actualQuantity} kg` : '--'}
                            </strong>
                          </td>
                          <td>
                            <span className={`status-pill ${
                              t.status === 'Completed' ? 'approved' :
                              t.status === 'Reported Issue' ? 'warning' : 'deny'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>{t.status === 'Completed' ? '09:12 AM' : 'Current Shift'}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 6: PERSONAL PERFORMANCE
            --------------------------------------------------------------------- */}
        {activeTab === 'performance' && (
          <div className="mgmt-sub-view">
            
            <div className="kpi-grid">
              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--primary)' }}>
                <div className="kpi-title">
                  <span>Success Rate</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--primary)" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M22 4L12 14.01l-3-3"></path></svg>
                </div>
                <div className="kpi-value">{performance.completionRate}%</div>
                <div className="kpi-label">Weekly target achievement</div>
              </div>

              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--gold-light)' }}>
                <div className="kpi-title">
                  <span>Weekly Diverted Weight</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--gold-light)" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                </div>
                <div className="kpi-value">{performance.weeklyCollectionsKg.toLocaleString()} kg</div>
                <div className="kpi-label">Diverted directly to digesters</div>
              </div>

              <div className="glass-panel kpi-card" style={{ borderLeftColor: 'var(--secondary)' }}>
                <div className="kpi-title">
                  <span>Avg Stop Duration</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--secondary)" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="kpi-value">{performance.avgTimePerStopMin} mins</div>
                <div className="kpi-label">Average emptying handshake delay</div>
              </div>
            </div>

            {/* Performance charts */}
            <div className="mgmt-grid-2col" style={{ gap: '25px' }}>
              
              {/* Daily completed stops bar chart */}
              <div className="glass-panel">
                <h3>Daily Completed Stops</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Stops serviced over the last 5 shifts.
                </p>
                <div className="chart-sim-wrapper">
                  <div className="chart-bar" style={{ height: '80%' }} data-val="8"></div>
                  <div className="chart-bar" style={{ height: '70%' }} data-val="7"></div>
                  <div className="chart-bar" style={{ height: '90%' }} data-val="9"></div>
                  <div className="chart-bar" style={{ height: '100%', background: 'linear-gradient(to top, var(--primary), var(--primary-glow))' }} data-val="10"></div>
                  <div className="chart-bar" style={{ height: `${(completedToday/totalToday)*100}%` }} data-val={completedToday}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI (TODAY)</span>
                </div>
              </div>

              {/* Hauling stats summary card */}
              <div className="glass-panel">
                <h3>Circular Operations Leaderboard</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Your contribution to the GreenGold environmental credits system.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>Weekly Tasks Completed</span>
                    <strong style={{ color: '#fff' }}>{performance.weeklyTasksCompleted}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>Weekly Tasks Skipped/Missed</span>
                    <strong style={{ color: 'var(--danger)' }}>{performance.weeklyTasksSkipped}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>Reported Hardware Issues</span>
                    <strong style={{ color: 'var(--gold-light)' }}>{performance.reportedIssuesCount} Bins</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>Estimated Carbon Prevented</span>
                    <strong style={{ color: 'var(--primary)' }}>{(performance.weeklyCollectionsKg * 0.000912).toFixed(3)} MT CO2e</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 7: NOTIFICATIONS
            --------------------------------------------------------------------- */}
        {activeTab === 'notifications' && (
          <div className="mgmt-sub-view">
            
            <div className="glass-panel table-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Shift Alerts & Notices</h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {notifications.filter(n => !n.read).length} unread notifications
                </span>
              </div>

              <div className="logs-container">
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No notifications found.</p>
                ) : (
                  notifications.map((n) => (
                    <div className="log-row" key={n.id} style={{ opacity: n.read ? 0.6 : 1, padding: '15px', background: n.read ? 'transparent' : 'rgba(16,185,129,0.03)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.05)' }}>
                      <span className="log-badge" style={{
                        background: n.type === 'alert' ? 'rgba(239, 68, 68, 0.15)' : n.type === 'info' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(240, 253, 244, 0.08)',
                        color: n.type === 'alert' ? 'var(--danger)' : n.type === 'info' ? 'var(--gold-light)' : '#fff'
                      }}>
                        {n.type}
                      </span>
                      
                      <div style={{ flex: 1 }}>
                        <div className="log-message" style={{ fontWeight: n.read ? 'bold' : 'normal' }}>{n.message}</div>
                        <div className="log-time">{n.time}</div>
                      </div>

                      {!n.read && (
                        <button className="action-btn approve" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => onClearNotification(n.id)}>
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB VIEW 8: PROFILE / SHIFT METADATA
            --------------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="mgmt-sub-view">
            
            <div className="mgmt-grid-2col" style={{ gap: '25px' }}>
              
              {/* Profile Details Card */}
              <div className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                  <div className="profile-avatar" style={{ width: '64px', height: '64px', fontSize: '20px' }}>{initials}</div>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '22px' }}>{shift.driverName}</h3>
                    <p style={{ color: 'var(--gold-light)', fontSize: '13.5px', fontWeight: '600' }}>{shift.role}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Staff Registry ID</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>{shift.staffId}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Assigned Shift Details</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>{shift.shiftName}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Assigned Logistics Zone</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>{shift.assignedZone}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Contact Number</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>{shift.contactNo}</strong>
                  </div>
                </div>
              </div>

              {/* Vehicle & Shift Details Card */}
              <div className="glass-panel">
                <h3>Truck & Logistics Assignment</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Telemetry regarding your assigned transport vehicle.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Assigned Truck Model</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>{shift.vehicleId}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Battery / Fuel Level</span>
                    <strong style={{ color: 'var(--primary)', marginTop: '2px' }}>⚡ 87% Charge Remaining</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Payload Weight Capacity</span>
                    <strong style={{ color: '#fff', marginTop: '2px' }}>1200 / 3500 kg loaded</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>E-Logbook Status</span>
                    <strong style={{ color: 'var(--primary)', marginTop: '2px' }}>✅ Electronic Logs Compliant</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL 1: DETAILED TASK INFORMATION OVERLAY
          ========================================================================= */}
      {selectedTask && (
        <div className="login-gate" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--gold-light)', fontWeight: '800' }}>Task ID Reference: {selectedTask.id}</span>
                <h3 style={{ fontSize: '22px', color: '#fff', marginTop: '4px' }}>{selectedTask.collectionPoint}</h3>
              </div>
              <span className={`status-pill ${selectedTask.priority === 'High' ? 'deny' : 'warning'}`}>
                {selectedTask.priority} Priority
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '25px' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Location / Address</span>
                <p style={{ fontSize: '13.5px', color: '#fff', marginTop: '2px' }}>{selectedTask.location}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Smart Bin Reference</span>
                  <div style={{ fontSize: '13.5px', color: '#fff', marginTop: '2px' }}>{selectedTask.binId}</div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Waste Category Type</span>
                  <div style={{ fontSize: '13.5px', color: '#fff', marginTop: '2px' }}>{selectedTask.wasteType}</div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Scheduled Time</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--gold-light)', marginTop: '2px' }}>{selectedTask.scheduledTime}</div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Telemetry level</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--primary)', marginTop: '2px' }}>{selectedTask.fillLevel}% Full</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Special Driver Instructions</span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  "{selectedTask.specialInstructions || "No special instructions provided."}"
                </p>
              </div>

              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dark)', fontWeight: '700' }}>Audit Telemetry History</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Last successfully collected: {selectedTask.lastCollection}
                </p>
              </div>
            </div>

            {/* Stepper controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedTask.status === 'Assigned' && (
                <button className="login-btn" style={{ width: '100%', marginTop: '0' }} onClick={() => triggerStatusUpdate(selectedTask.id, 'En Route')}>
                  🚚 Dispatch Vehicle (Mark En Route)
                </button>
              )}

              {selectedTask.status === 'En Route' && (
                <button className="login-btn" style={{ width: '100%', marginTop: '0', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))' }} onClick={() => triggerStatusUpdate(selectedTask.id, 'Arrived')}>
                  📍 Log GPS Arrival (Mark Arrived)
                </button>
              )}

              {selectedTask.status === 'Arrived' && (
                <button className="login-btn" style={{ width: '100%', marginTop: '0', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} onClick={() => triggerStatusUpdate(selectedTask.id, 'Collecting')}>
                  ⚡ Start Emptying Handshake (Collecting)
                </button>
              )}

              {selectedTask.status === 'Collecting' && (
                <button className="login-btn" style={{ width: '100%', marginTop: '0' }} onClick={() => handleStartCompleteModal(selectedTask)}>
                  ⚖️ Record Quantity & Save Collection
                </button>
              )}

              {selectedTask.status === 'Reported Issue' && (
                <button className="login-btn" style={{ width: '100%', marginTop: '0' }} onClick={() => triggerStatusUpdate(selectedTask.id, 'Collecting')}>
                  Clear Alert & Resume Collection
                </button>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
                {selectedTask.status !== 'Completed' && selectedTask.status !== 'Skipped' && selectedTask.status !== 'Failed' && (
                  <>
                    <button className="guest-bypass-btn" style={{ flex: 1, marginTop: '0', color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.4)' }} onClick={() => handleStartIssueModal(selectedTask)}>
                      ⚠️ Report Issue
                    </button>
                    <button className="guest-bypass-btn" style={{ flex: 1, marginTop: '0', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-muted)' }} onClick={() => triggerStatusUpdate(selectedTask.id, 'Skipped')}>
                      ⏭️ Skip Stop
                    </button>
                  </>
                )}
              </div>

              <button className="guest-bypass-btn" style={{ width: '100%', marginTop: '10px', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} onClick={() => setSelectedTask(null)}>
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: COMPLETE COLLECTION FORM OVERLAY
          ========================================================================= */}
      {showCompleteModal && taskForAction && (
        <div className="login-gate" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '500px', width: '90%' }}>
            
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>
              {completeConfirmation ? '⚠️ Final Confirm Collection' : '⚖️ Record Collection Quantity'}
            </h3>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {completeConfirmation ? 'Please double check the details below. Once submitted, this event will update the environmental carbon ledger.' : 'Fill in the actual waste weight collected from the IoT Composter Bin.'}
            </p>

            {completeConfirmation ? (
              /* Confirmation Screen */
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <div>Location: <strong>{taskForAction.collectionPoint}</strong></div>
                <div>Waste Category: <strong>{wasteType}</strong></div>
                <div>Actual Weight Diverted: <strong style={{ color: 'var(--gold-light)' }}>{actualQty} kg</strong></div>
                <div>Notes: <span style={{ color: 'var(--text-muted)' }}>"{notes || 'No notes added'}"</span></div>
                {reportIssueInComplete && <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Flagged placement issues</div>}
              </div>
            ) : (
              /* Form Input Screen */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Actual Quantity Collected (kg)</label>
                  <input
                    type="number"
                    className="login-input"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    placeholder="Enter weight in kg..."
                    style={{ fontSize: '14px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>Estimated weight expected: {taskForAction.estQuantity} kg</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Confirmed Waste Material Type</label>
                  <select
                    className="login-input"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    style={{ fontSize: '14px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                  >
                    <option value="Organic Food Waste">Organic Food Waste</option>
                    <option value="Recyclables (Plastics/Paper)">Recyclables (Plastics/Paper)</option>
                    <option value="Green/Carbon Waste">Green/Carbon Waste</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Operator Notes</label>
                  <textarea
                    className="login-input"
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contamination issues, bin condition, gate issues, etc..."
                    style={{ fontSize: '13px', resize: 'none', fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {/* Mock Photo Uploader */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Attach Photo Evidence (Optional)</label>
                  <div style={{ border: '1px dashed var(--border-color)', padding: '15px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }} onClick={() => alert("Mock Camera Handshake - Camera activated in developer simulation.")}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📸 Tap to activate vehicle scanner camera</span>
                  </div>
                </div>

                {/* Checkbox report issue */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <input
                    type="checkbox"
                    id="chk-issue"
                    checked={reportIssueInComplete}
                    onChange={(e) => setReportIssueInComplete(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="chk-issue" style={{ fontSize: '12.5px', color: 'var(--text-muted)', cursor: 'pointer' }}>Report minor bin sorting issues</label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="login-btn" style={{ width: '100%', marginTop: '0' }} onClick={submitCompleteCollection}>
                {completeConfirmation ? '✔️ Yes, Finalize and Log Credits' : 'Save Collection Record'}
              </button>

              <button className="guest-bypass-btn" style={{ width: '100%', marginTop: '0', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} onClick={() => { setShowCompleteModal(false); setCompleteConfirmation(false); }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REPORT AN ISSUE OVERLAY
          ========================================================================= */}
      {showIssueModal && taskForAction && (
        <div className="login-gate" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="glass-panel login-card" style={{ maxWidth: '500px', width: '90%' }}>
            
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>⚠️ Report Field Issue</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Flag maintenance, access blockages, or contamination events for <strong>{taskForAction.collectionPoint}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Issue Category</label>
                <select
                  className="login-input"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  style={{ fontSize: '14px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                >
                  <option value="Bin damaged">Bin damaged</option>
                  <option value="Bin overflowing">Bin overflowing</option>
                  <option value="Wrong waste type (Contamination)">Wrong waste type (Contamination)</option>
                  <option value="Collection point inaccessible">Collection point inaccessible</option>
                  <option value="Vehicle problem">Vehicle problem</option>
                  <option value="Route blocked">Route blocked</option>
                  <option value="Safety issue">Safety issue</option>
                  <option value="Unable to collect">Unable to collect</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Issue Urgency / Severity</label>
                <select
                  className="login-input"
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  style={{ fontSize: '14px', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                >
                  <option value="High">🚨 High (Immediate Dispatch Needed)</option>
                  <option value="Medium">⚠️ Medium (Scheduled Repair)</option>
                  <option value="Low">ℹ️ Low (Monitor Site)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Description of Problem</label>
                <textarea
                  className="login-input"
                  rows="3"
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Enter detailed description of what happened..."
                  style={{ fontSize: '13px', resize: 'none', fontFamily: 'var(--font-body)' }}
                />
              </div>

              {/* Mock Photo Uploader */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'var(--gold-light)', fontWeight: '700', textTransform: 'uppercase' }}>Upload Photo Evidence (Optional)</label>
                <div style={{ border: '1px dashed var(--border-color)', padding: '15px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }} onClick={() => alert("Camera activated in simulation.")}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📸 Tap to photograph issue</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="login-btn" style={{ width: '100%', marginTop: '0', background: 'linear-gradient(135deg, var(--danger), #ef4444)' }} onClick={submitReportIssue}>
                ⚠️ Submit Report & Update Task
              </button>

              <button className="guest-bypass-btn" style={{ width: '100%', marginTop: '0', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} onClick={() => { setShowIssueModal(false); setTaskForAction(null); }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
