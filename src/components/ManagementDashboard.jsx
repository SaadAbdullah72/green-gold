import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TECH_CREWS, LOGISTICS_PARTNERS, FACTORY_REPORTS } from '../mockData';
import { api } from '../api';
import DashboardAssistant from './DashboardAssistant';

const siteActivePinIcon = L.divIcon({
  className: '',
  html: '<div style="width:32px;height:32px;border-radius:50%;background:#10B981;border:3px solid #FFFFFF;box-shadow:0 6px 20px rgba(16,185,129,0.7);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:900;">🏢</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function ManagementDashboard({
  username = 'System Admin',
  onLogout,
  activeSubTab: propActiveSubTab = 'approvals',
  setActiveSubTab: propSetActiveSubTab,
  stats = {
    activeBins: 0,
    totalWasteDivertedKg: 0,
    certifiedCarbonCreditsMt: 0,
    pendingCarbonCreditsMt: 0,
    recycledPlasticsKg: 0,
  },
  activeSites = [],
  installRequests = [],
  batchesAwaitingCert = [],
  collectedWasteQueue = [],
  logs = [],
  factoryPeriod: propFactoryPeriod = 'weekly',
  setFactoryPeriod: propSetFactoryPeriod,
  handleApproveReq = () => {},
  handleDenyReq = () => {},
  handleCertifyCarbon = () => {},
  handleAssignLogistics = () => {},
  showTechModal = false,
  setShowTechModal = () => {},
  confirmApproveReq = () => {},
  showLogisticsModal = false,
  setShowLogisticsModal = () => {},
  confirmAssignLogistics = () => {}
}) {
  const [localActiveSubTab, setLocalActiveSubTab] = useState(propActiveSubTab || 'approvals');
  const [localFactoryPeriod, setLocalFactoryPeriod] = useState(propFactoryPeriod || 'weekly');
  const [localInstallRequests, setLocalInstallRequests] = useState(Array.isArray(installRequests) ? installRequests : []);
  const [localCollectedWasteQueue, setLocalCollectedWasteQueue] = useState(Array.isArray(collectedWasteQueue) ? collectedWasteQueue : []);
  const [localBatchesAwaitingCert, setLocalBatchesAwaitingCert] = useState(Array.isArray(batchesAwaitingCert) ? batchesAwaitingCert : []);

  const activeSubTab = propSetActiveSubTab ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setLocalActiveSubTab;
  const factoryPeriod = propSetFactoryPeriod ? propFactoryPeriod : localFactoryPeriod;
  const setFactoryPeriod = propSetFactoryPeriod || setLocalFactoryPeriod;

  useEffect(() => {
    setLocalInstallRequests(Array.isArray(installRequests) ? installRequests : []);
  }, [installRequests]);

  useEffect(() => {
    setLocalBatchesAwaitingCert(Array.isArray(batchesAwaitingCert) ? batchesAwaitingCert : []);
  }, [batchesAwaitingCert]);

  // Real Backend Data State
  const [dbRequests, setDbRequests] = useState([]);
  const [dbWorkers, setDbWorkers] = useState([]);
  const [dbAuditLogs, setDbAuditLogs] = useState([]);
  const [dbCollectionQueue, setDbCollectionQueue] = useState([]);
  const [dbActiveSites, setDbActiveSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [clearingData, setClearingData] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    setLocalCollectedWasteQueue(Array.isArray(dbCollectionQueue) ? dbCollectionQueue : []);
  }, [dbCollectionQueue]);

  // Reset & Clear Previous Test Requests
  const handleClearAllStaleRequests = async () => {
    if (!window.confirm('Clear all previous test requests for a fresh clean demonstration?')) return;
    try {
      setClearingData(true);
      localStorage.removeItem('greengold_collection_requests');
      const res = await fetch('/api/iot/reset-requests', { method: 'POST' });
      await res.json();
      await loadManagementData(true);
      alert('All test requests cleared successfully!');
    } catch (err) {
      alert('Reset error: ' + err.message);
    } finally {
      setClearingData(false);
    }
  };

  // Mandatory Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState(null);
  const [declineReasonText, setDeclineReasonText] = useState('');
  const [declineError, setDeclineError] = useState('');

  // Worker Assign Modal State
  const [showWorkerAssignModal, setShowWorkerAssignModal] = useState(false);
  const [assignTargetReq, setAssignTargetReq] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [binsQuota, setBinsQuota] = useState(2);
  const [assignMessage, setAssignMessage] = useState('');

  const [showCollectorAssignModal, setShowCollectorAssignModal] = useState(false);
  const [selectedPickupToAssign, setSelectedPickupToAssign] = useState(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [collectorAssignMessage, setCollectorAssignMessage] = useState('');
  const [dbCollectors, setDbCollectors] = useState([]);

  const loadManagementData = async (isInitial = false) => {
    try {
      const reqRes = await api.management.getRequests();
      if (reqRes.requests) {
        setDbRequests(prev => JSON.stringify(prev) !== JSON.stringify(reqRes.requests) ? reqRes.requests : prev);
      }

      const workerRes = await api.management.getWorkers();
      if (workerRes.workers) {
        setDbWorkers(prev => JSON.stringify(prev) !== JSON.stringify(workerRes.workers) ? workerRes.workers : prev);
      }

      const collectorRes = await api.management.getCollectors();
      if (collectorRes.collectors) {
        setDbCollectors(prev => JSON.stringify(prev) !== JSON.stringify(collectorRes.collectors) ? collectorRes.collectors : prev);
      }

      const collectionQueueRes = await api.management.getCollectionQueue();
      if (collectionQueueRes.requests) {
        setDbCollectionQueue(prev => JSON.stringify(prev) !== JSON.stringify(collectionQueueRes.requests) ? collectionQueueRes.requests : prev);
      }

      const sitesRes = await api.management.getActiveSites();
      if (sitesRes.sites) {
        setDbActiveSites(prev => JSON.stringify(prev) !== JSON.stringify(sitesRes.sites) ? sitesRes.sites : prev);
        if (!selectedSite && sitesRes.sites.length > 0) {
          setSelectedSite(sitesRes.sites[0]);
        }
      }

      const auditRes = await api.audit.getLogs();
      if (auditRes.logs) {
        setDbAuditLogs(prev => JSON.stringify(prev) !== JSON.stringify(auditRes.logs) ? auditRes.logs : prev);
      }
    } catch (err) {
      if (err.message && (err.message.includes('Token') || err.message.includes('authorized'))) {
        if (onLogout) onLogout();
      }
    }
  };

  useEffect(() => {
    loadManagementData(true);
    const timer = setInterval(() => {
      loadManagementData(false);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleApproveDbRequest = async (reqId) => {
    try {
      await api.management.approveRequest(reqId);
      setDbRequests(prev => prev.map(r => r._id === reqId ? { ...r, status: 'ASSIGNING' } : r));
      const target = dbRequests.find(r => r._id === reqId);
      if (target) {
        setAssignTargetReq(target);
        setSelectedWorkerId('');
        setAssignMessage('');
        setShowWorkerAssignModal(true);
      }
    } catch (err) {
      alert(`Approve Error: ${err.message}`);
    }
  };

  const handleAssignLogisticsAction = (pickupId) => {
    const pickup = safeCollectedWasteQueue.find(item => item.id === pickupId) || safeCollectedWasteQueue[0];
    setSelectedPickupToAssign(pickup || { id: pickupId, site: 'Unknown pickup', locationName: 'Unknown site' });
    setSelectedCollectorId('');
    setCollectorAssignMessage('');
    setShowCollectorAssignModal(true);
    if (typeof handleAssignLogistics === 'function') {
      handleAssignLogistics(pickupId);
    }
  };

  const handleCollectorAssignSubmit = async () => {
    if (!selectedPickupToAssign || !selectedCollectorId) {
      alert('Please select a collector for this pickup assignment.');
      return;
    }

    try {
      const res = await api.management.assignCollector(selectedPickupToAssign.id, selectedCollectorId, {
        siteName: selectedPickupToAssign.site || 'Assigned Pickup',
        locationName: selectedPickupToAssign.locationName || selectedPickupToAssign.site || 'Assigned Pickup',
        address: selectedPickupToAssign.address || 'Islamabad',
        town: selectedPickupToAssign.town || 'F-7',
        city: selectedPickupToAssign.city || 'Islamabad',
        lat: selectedPickupToAssign.lat || 33.6844,
        lng: selectedPickupToAssign.lng || 73.0479,
        fillLevel: selectedPickupToAssign.fillLevel || 0,
        timeFullMinutes: selectedPickupToAssign.timeFullMinutes || 0,
        urgency: selectedPickupToAssign.urgency || 'Medium',
        binId: selectedPickupToAssign.binId || selectedPickupToAssign.id,
        requestId: selectedPickupToAssign.requestId || null
      });

      setCollectorAssignMessage(res.message || 'Collector assigned successfully.');
      const nextQueue = safeCollectedWasteQueue.map(item => item.id === selectedPickupToAssign.id ? { ...item, status: 'Assigned to Collector', assignedCollector: selectedCollectorId } : item);
      setLocalCollectedWasteQueue(nextQueue);

      try {
        const storedQueue = JSON.parse(localStorage.getItem('greengold_collection_requests') || '[]');
        const updatedStoredQueue = Array.isArray(storedQueue)
          ? storedQueue.map(item => item.id === selectedPickupToAssign.id ? { ...item, status: 'Assigned to Collector', assignedPartner: selectedCollectorId } : item)
          : [];
        localStorage.setItem('greengold_collection_requests', JSON.stringify(updatedStoredQueue));
      } catch (error) {
        console.warn('Failed to sync collection queue to localStorage:', error);
      }

      setTimeout(() => {
        setShowCollectorAssignModal(false);
        setCollectorAssignMessage('');
      }, 1200);
    } catch (err) {
      alert(`Collector Assignment Error: ${err.message}`);
    }
  };

  const handleCertifyCarbonAction = (batchId) => {
    const nextBatches = localBatchesAwaitingCert.filter(batch => batch.id !== batchId);
    setLocalBatchesAwaitingCert(nextBatches);
    if (typeof handleCertifyCarbon === 'function') {
      handleCertifyCarbon(batchId);
    }
  };

  const handleOpenDeclineModal = (reqId) => {
    setDeclineTargetId(reqId);
    setDeclineReasonText('');
    setDeclineError('');
    setShowDeclineModal(true);
  };

  const handleSubmitDeclineReason = async () => {
    if (!declineReasonText || declineReasonText.trim().length === 0) {
      setDeclineError('Decline reason is mandatory before declining a request.');
      return;
    }
    try {
      await api.management.declineRequest(declineTargetId, declineReasonText);
      setDbRequests(prev => prev.map(r => r._id === declineTargetId ? { ...r, status: 'DECLINED', declineReason: declineReasonText.trim() } : r));
      setShowDeclineModal(false);
    } catch (err) {
      setDeclineError(err.message);
    }
  };

  const handleAssignWorkerSubmit = async () => {
    if (!selectedWorkerId) {
      alert('Please select an eligible technical worker.');
      return;
    }
    try {
      const res = await api.management.assignJob(assignTargetReq._id, selectedWorkerId, binsQuota);
      setAssignMessage(res.message || 'Worker assigned successfully.');
      setTimeout(() => {
        setShowWorkerAssignModal(false);
        setAssignMessage('');
      }, 1200);
    } catch (err) {
      alert(`Assignment Error: ${err.message}`);
    }
  };
  // Extract user initials to render in the profile card avatar circle
  const initials = username.split(/[ _]/).map(w => w[0]).join("").toUpperCase().substring(0, 2);

  // Compute pending alert badges for each dashboard sub-tab
  const normalizeCollectionStatus = (value) => {
    if (!value) return 'Awaiting Partner';
    const normalized = String(value).trim();
    if (normalized === 'WAITING_COLLECTION' || normalized === 'Awaiting Partner') return 'Awaiting Partner';
    if (normalized === 'ROUTED_FOR_COLLECTION' || normalized === 'Assigned to Collector' || normalized === 'Assigned to Partner') return 'Assigned to Collector';
    return normalized;
  };

  const safeInstallRequests = Array.isArray(installRequests) ? installRequests : [];
  const safeCollectedWasteQueue = Array.isArray(localCollectedWasteQueue) && localCollectedWasteQueue.length > 0 ? localCollectedWasteQueue : (Array.isArray(collectedWasteQueue) ? collectedWasteQueue : []);
  const safeBatchesAwaitingCert = Array.isArray(localBatchesAwaitingCert) && localBatchesAwaitingCert.length > 0 ? localBatchesAwaitingCert : (Array.isArray(batchesAwaitingCert) ? batchesAwaitingCert : []);
  const pendingApprovalsCount = safeInstallRequests.filter(r => r.status === 'Pending').length;
  const pendingLogisticsCount = safeCollectedWasteQueue.filter(w => {
    const status = normalizeCollectionStatus(w.status || w.assignmentStatus || w.requestStatus);
    return status === 'Awaiting Partner' || status === 'Assigned to Collector';
  }).length;
  const pendingCarbonCount = safeBatchesAwaitingCert.filter(b => b.status === 'Awaiting Certification').length;

  return (
    <div className="app-container">
      
      {/* =========================================================================
          LEFT SIDEBAR NAVIGATION
          ========================================================================= */}
      <aside className="sidebar-left">
        {/* Brand Header */}
        <div className="app-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
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
      <main className="main-content" style={{ flex: 1, padding: '32px', overflowY: 'auto', height: '100vh' }}>
        {/* Top Greeting & Section Header */}
        <div className="top-greeting-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar-circle">
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Good Morning</div>
              <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.02em' }}>{username}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="rewards-pill">
              🍃 1,257 Rewards
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' }}>
              🔔
            </div>
            <span className="pill-badge">
              Executive Authority
            </span>
          </div>
        </div>

        {/* KPI Indicators Grid */}
        <div className="stats-grid">
          {/* Gauge 1: Active provisions count */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>ACTIVE BINS IN FIELD</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.1', marginBottom: '8px' }}>{stats.activeBins}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across active client zones</div>
          </div>
          
          {/* Gauge 2: Weight statistics */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>ORGANIC DIVERTED</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>{stats.totalWasteDivertedKg.toLocaleString()} kg</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Processed into organic products</div>
          </div>

          {/* Gauge 3: Minted carbon avoidance balance */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>MINTED CARBON CREDITS</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.1', marginBottom: '8px' }}>{stats.certifiedCarbonCreditsMt.toFixed(2)} MT</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending verification: {stats.pendingCarbonCreditsMt.toFixed(2)} MT</div>
          </div>

          {/* Gauge 4: Inorganic recovery sorting */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>PLASTICS RECOVERED</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>{stats.recycledPlasticsKg} kg</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cleanliness Grade A</div>
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
                      {dbRequests.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            No service requests found in database.
                          </td>
                        </tr>
                      ) : (
                        dbRequests.map(req => (
                          <tr key={req._id}>
                            <td><strong>{req.requestNumber}</strong></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{req.organizationName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Contact: {req.contactPerson} | {req.phone}
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--gold-light)' }}>{req.numberOfBins} Bins</strong>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                Workers Required: {req.requiredWorkers || Math.ceil(req.numberOfBins / 2)}
                              </div>
                            </td>
                            <td>
                              <div>{req.town}, {req.city}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.address}</div>
                            </td>
                            <td>
                              <span className={`status-badge ${req.status.toLowerCase()}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {req.status}
                              </span>
                              {req.declineReason && (
                                <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px' }}>
                                  Reason: "{req.declineReason}"
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="action-btn-group">
                                {(req.status === 'SUBMITTED' || req.status === 'PENDING_REVIEW') && (
                                  <>
                                    <button className="action-btn approve" onClick={() => handleApproveDbRequest(req._id)}>
                                      Approve
                                    </button>
                                    <button className="action-btn deny" onClick={() => handleOpenDeclineModal(req._id)}>
                                      Decline
                                    </button>
                                  </>
                                )}

                                {(req.status === 'APPROVED' || req.status === 'ASSIGNING' || req.status === 'ASSIGNED') && (
                                  <button className="action-btn approve" style={{ background: '#3B82F6' }} onClick={() => { setAssignTargetReq(req); setShowWorkerAssignModal(true); }}>
                                    Assign Worker ({req.assignedWorkersCount || 0}/{req.requiredWorkers || Math.ceil(req.numberOfBins / 2)})
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ACTIVE APPROVED DEPLOYMENTS & TECHNICAL TEAM STATUS TRACKER */}
                <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '2px dashed #E2E8F0' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '6px' }}>
                    Active Approved Deployments & Technical Team Status
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
                    Real-time status tracking for approved bin deployment requests, assigned technical staff, and installation completion progress.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {dbRequests.filter(r => r.status === 'APPROVED' || r.status === 'ASSIGNING' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'Completed').length === 0 ? (
                      <div style={{ padding: '36px', background: '#F8FAFC', borderRadius: '16px', textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
                        No active approved bin deployment requests currently in field execution.
                      </div>
                    ) : (
                      dbRequests.filter(r => r.status === 'APPROVED' || r.status === 'ASSIGNING' || r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'Completed').map(req => {
                        const assignedList = req.assignedWorkers || [];
                        const completedCount = assignedList.filter(w => w.status === 'COMPLETED').length;
                        const totalAssigned = assignedList.length;
                        const progressPct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

                        return (
                          <div key={req._id} style={{ padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Req #{req.requestNumber}
                                </span>
                                <h4 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                                  {req.organizationName}
                                </h4>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                  📍 {req.address}, {req.town}, {req.city}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: req.status === 'Completed' ? '#D1FAE5' : '#EFF6FF', color: req.status === 'Completed' ? '#065F46' : '#1D4ED8' }}>
                                  {req.status === 'Completed' ? '✔ Completed' : `Staffing: ${totalAssigned}/${req.requiredWorkers || 1}`}
                                </span>
                              </div>
                            </div>

                            {/* PROGRESS BAR */}
                            <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                                <span style={{ color: '#0F172A' }}>Overall Installation Progress</span>
                                <span style={{ color: '#047857' }}>{progressPct}% Completed ({completedCount}/{totalAssigned || req.requiredWorkers || 1} tasks done)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${progressPct}%`, height: '100%', background: '#10B981', transition: 'width 0.3s ease' }}></div>
                              </div>
                            </div>

                            {/* ASSIGNED WORKERS CARD LIST */}
                            <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                              <h5 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Assigned Technical Crew
                              </h5>
                              {assignedList.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                                  No technical workers assigned yet. Click "Assign Worker" above to dispatch staff.
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                  {assignedList.map((item, idx) => {
                                    const w = item.worker || {};
                                    const wStatus = item.status;
                                    let badgeBg = '#FEF3C7';
                                    let badgeColor = '#92400E';
                                    let badgeText = 'Waiting for Worker Response';

                                    if (wStatus === 'ACCEPTED') {
                                      badgeBg = '#E0F2FE';
                                      badgeColor = '#0369A1';
                                      badgeText = 'Duty Accepted (Preparing)';
                                    } else if (wStatus === 'IN_PROGRESS') {
                                      badgeBg = '#EFF6FF';
                                      badgeColor = '#1E40AF';
                                      badgeText = 'On-Site Installation Work In Progress';
                                    } else if (wStatus === 'PARTIALLY_DELAYED') {
                                      badgeBg = '#FEF3C7';
                                      badgeColor = '#B45309';
                                      badgeText = `Partially Delayed: "${item.delayReason || 'Site access issue'}"`;
                                    } else if (wStatus === 'COMPLETED') {
                                      badgeBg = '#D1FAE5';
                                      badgeColor = '#065F46';
                                      badgeText = 'Task Done / Installation Completed';
                                    } else if (wStatus === 'DECLINED') {
                                      badgeBg = '#FEE2E2';
                                      badgeColor = '#991B1B';
                                      badgeText = `Declined: "${item.declineReason || 'Unavailable'}"`;
                                    }

                                    return (
                                      <div key={idx} style={{ background: '#FFFFFF', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px' }}>
                                          {w.fullName || 'Technical Staff'} (ID: {w.employeeId || 'T-101'})
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                          Phone: {w.phone || '+92 300 0000000'} | Emergency: {w.secondaryPhone || w.phone}
                                        </div>
                                        <div style={{ marginTop: '10px' }}>
                                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: badgeBg, color: badgeColor }}>
                                            {badgeText}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Collected Waste Awaiting Logistics Routing</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      Bins filled/emptied in the field. Dispatch a collector to route these loads to compost recycling plants.
                    </p>
                  </div>
                  <button
                    onClick={handleClearAllStaleRequests}
                    disabled={clearingData}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {clearingData ? 'Clearing...' : '🧹 Clear Test Queue'}
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Site Origin</th>
                        <th>Collected Weight</th>
                        <th>Waste Type</th>
                        <th>Date</th>
                        <th>Action & Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeCollectedWasteQueue.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            All collected waste loads have been dispatched to factories. No pending pickups.
                          </td>
                        </tr>
                      ) : (
                        safeCollectedWasteQueue.map(item => {
                          const rowStatus = normalizeCollectionStatus(item.status || item.assignmentStatus || item.requestStatus);
                          const isAssigned = rowStatus.includes('Assigned to Collector') || rowStatus.includes('Waiting for Response');
                          const isInProgress = rowStatus.includes('In Progress') || rowStatus.includes('On Route');
                          const isCompleted = rowStatus === 'Completed';
                          const isAwaiting = !isAssigned && !isInProgress && !isCompleted;

                          let badgeBg = '#FEF3C7';
                          let badgeColor = '#92400E';
                          let badgeText = rowStatus;

                          if (isAssigned) {
                            badgeBg = '#EFF6FF';
                            badgeColor = '#1D4ED8';
                            badgeText = `Assigned to ${item.assignedCollectorName || 'Collector'} (Waiting for Response)`;
                          } else if (isInProgress) {
                            badgeBg = '#FEF3C7';
                            badgeColor = '#B45309';
                            badgeText = `In Progress: ${item.assignedCollectorName || 'Collector'} (On Route)`;
                          } else if (isCompleted) {
                            badgeBg = '#D1FAE5';
                            badgeColor = '#065F46';
                            badgeText = '✔ Completed (Waste Picked Up)';
                          } else {
                            badgeBg = '#FEF3C7';
                            badgeColor = '#92400E';
                            badgeText = 'Waiting for Assignment';
                          }

                          return (
                            <tr key={item.id || item._id}>
                              <td><strong>{item.id || item._id}</strong></td>
                              <td><strong>{item.site || item.locationName || 'Collection site'}</strong></td>
                              <td><strong style={{ color: 'var(--gold-light)' }}>{item.weightKg || 0} kg</strong></td>
                              <td>{item.wasteType || 'Waste Collection'}</td>
                              <td>{item.collectedDate || 'N/A'}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <span style={{ 
                                    display: 'inline-block', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '11px', 
                                    fontWeight: 800, 
                                    background: badgeBg, 
                                    color: badgeColor,
                                    border: `1px solid ${isAssigned ? '#BFDBFE' : isCompleted ? '#A7F3D0' : '#FDE68A'}`
                                  }}>
                                    {badgeText}
                                  </span>

                                  {isAwaiting && (
                                    <button className="action-btn approve" onClick={() => handleAssignLogisticsAction(item.id || item._id)}>
                                      Assign Collector
                                    </button>
                                  )}

                                  {isAssigned && (
                                    <button 
                                      className="action-btn" 
                                      style={{ background: '#3B82F6', color: 'white', border: 'none' }} 
                                      onClick={() => handleAssignLogisticsAction(item.id || item._id)}
                                    >
                                      Reassign Collector
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
                      {safeBatchesAwaitingCert.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No compost batches awaiting certification.
                          </td>
                        </tr>
                      ) : (
                        safeBatchesAwaitingCert.map(batch => (
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
                              <button className="action-btn approve" onClick={() => handleCertifyCarbonAction(batch.id)}>
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
            SUB TAB VIEW 6: ACTIVE CLIENT SITES & SMART BINS LEDGER
            --------------------------------------------------------------------- */}
        {activeSubTab === 'sites' && (
          <div className="mgmt-sub-view active">
            {/* Top Summary Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active Clients</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>
                  {dbActiveSites.length > 0 ? dbActiveSites.length : '3 Sites'}
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>● Provisioned & Verified</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployed Smart Bins</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                  {dbActiveSites.length > 0 ? dbActiveSites.reduce((acc, s) => acc + (s.numberOfBins || 1), 0) : '6 Units'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>BIN-01-XX, BIN-02-XX Standard</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetry Connectivity</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#3B82F6', marginTop: '4px' }}>100% Online</div>
                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700', marginTop: '2px' }}>⚡ Proteus Bridge Sync Active</div>
              </div>
            </div>

            {/* Split Screen: Left Cards List | Right Interactive Map & Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Client Sites List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Provisioned Client Facilities
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
                    Click a client to view location map
                  </span>
                </div>

                {((dbActiveSites && dbActiveSites.length > 0) ? dbActiveSites : [
                  {
                    id: 'site-01',
                    clientIndex: 1,
                    clientCode: 'CLIENT-01',
                    binPrefix: 'BIN-01',
                    deployedBinIds: ['BIN-01-01', 'BIN-01-02'],
                    organizationName: 'Serena Hotel Islamabad',
                    contactPerson: 'Zulfiqar Ali (Operations Director)',
                    phone: '+92 51 2874000',
                    address: 'Club Road, Sector G-5/1',
                    town: 'G-5',
                    city: 'Islamabad',
                    lat: 33.7206,
                    lng: 73.1070,
                    numberOfBins: 2,
                    status: 'ACTIVE'
                  },
                  {
                    id: 'site-02',
                    clientIndex: 2,
                    clientCode: 'CLIENT-02',
                    binPrefix: 'BIN-02',
                    deployedBinIds: ['BIN-02-01', 'BIN-02-02'],
                    organizationName: 'Bahria Town Phase 7',
                    contactPerson: 'Malik Taimoor (Horticulture Lead)',
                    phone: '+92 51 5705801',
                    address: 'Corniche Road, River View Commercial',
                    town: 'Phase 7',
                    city: 'Rawalpindi',
                    lat: 33.5255,
                    lng: 73.1098,
                    numberOfBins: 2,
                    status: 'ACTIVE'
                  },
                  {
                    id: 'site-03',
                    clientIndex: 3,
                    clientCode: 'CLIENT-03',
                    binPrefix: 'BIN-03',
                    deployedBinIds: ['BIN-03-01', 'BIN-03-02'],
                    organizationName: 'PAF Complex Sector E-9',
                    contactPerson: 'Wing Cmdr. Tariq (Station Ops)',
                    phone: '+92 51 9507111',
                    address: 'PAF Complex, Margalla Road, Sector E-9',
                    town: 'E-9',
                    city: 'Islamabad',
                    lat: 33.7145,
                    lng: 73.0238,
                    numberOfBins: 2,
                    status: 'ACTIVE'
                  }
                ]).map((site) => {
                  const isSelected = selectedSite && (selectedSite.id === site.id || selectedSite._id === site._id || selectedSite.organizationName === site.organizationName);
                  const binList = site.deployedBinIds || [`${site.binPrefix || 'BIN-01'}-01`];

                  return (
                    <div
                      key={site.id || site._id}
                      onClick={() => setSelectedSite(site)}
                      style={{
                        padding: '18px 20px',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #10B981' : '1px solid #E2E8F0',
                        boxShadow: isSelected ? '0 8px 24px rgba(16,185,129,0.18)' : '0 2px 8px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#ECFDF5',
                            color: '#047857',
                            fontSize: '10px',
                            fontWeight: '900',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            marginBottom: '4px'
                          }}>
                            {site.clientCode || `CLIENT-${String(site.clientIndex || 1).padStart(2, '0')}`}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                            {site.organizationName}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            📍 {site.address}, {site.town}, {site.city}
                          </div>
                        </div>

                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: '#D1FAE5',
                          color: '#065F46'
                        }}>
                          ● ACTIVE
                        </span>
                      </div>

                      {/* Deployed Bin IDs List */}
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Deployed Smart Bins ({binList.length} Units):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {binList.map((bId, bIdx) => (
                            <span
                              key={bIdx}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                fontSize: '11px',
                                fontWeight: '800',
                                color: '#1E293B'
                              }}
                            >
                              🏷️ {bId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Site Interactive Map & Deep Inspection */}
              <div style={{ position: 'sticky', top: '20px' }}>
                {(() => {
                  const currentSite = selectedSite || (dbActiveSites && dbActiveSites.length > 0 ? dbActiveSites[0] : {
                    organizationName: 'Serena Hotel Islamabad',
                    address: 'Club Road, Sector G-5/1, Islamabad',
                    town: 'G-5',
                    lat: 33.7206,
                    lng: 73.1070,
                    clientCode: 'CLIENT-01',
                    deployedBinIds: ['BIN-01-01', 'BIN-01-02'],
                    contactPerson: 'Zulfiqar Ali',
                    phone: '+92 51 2874000',
                    numberOfBins: 2
                  });

                  const currentLat = currentSite.lat || 33.7206;
                  const currentLng = currentSite.lng || 73.1070;

                  return (
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {currentSite.clientCode || 'CLIENT SITE'} • GPS TELEMETRY HUB
                          </div>
                          <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>
                            {currentSite.organizationName}
                          </h3>
                        </div>
                        <div style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#065F46' }}>
                          GPS: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                        </div>
                      </div>

                      {/* Map Container */}
                      <div style={{ height: '320px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '18px' }}>
                        <MapContainer
                          center={[currentLat, currentLng]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapRecenter lat={currentLat} lng={currentLng} />
                          <Marker position={[currentLat, currentLng]} icon={siteActivePinIcon}>
                            <Popup>
                              <div style={{ padding: '4px' }}>
                                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{currentSite.organizationName}</strong>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{currentSite.address}</div>
                                <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '700', color: '#047857' }}>
                                  Active Bins: {(currentSite.deployedBinIds || []).join(', ')}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>

                      {/* Site Details Card */}
                      <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: '700', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Contact Person</span>
                          <strong style={{ color: '#0F172A' }}>{currentSite.contactPerson || 'Site Supervisor'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: '700', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Phone Number</span>
                          <strong style={{ color: '#0F172A' }}>{currentSite.phone || '+92 300 0000000'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: '700', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Street Placement</span>
                          <strong style={{ color: '#0F172A' }}>{currentSite.address}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontWeight: '700', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Proteus Target Bin</span>
                          <strong style={{ color: '#047857' }}>{(currentSite.deployedBinIds && currentSite.deployedBinIds[0]) || 'BIN-01-01'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

      </main>

      <DashboardAssistant dashboardName="management" accent="#10B981" />

      {/* =========================================================================
          MODAL A: MANDATORY DECLINE REASON MODAL
          ========================================================================= */}
      {showDeclineModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div className="soft-card" style={{ maxWidth: '480px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#991B1B', marginBottom: '8px' }}>
              Decline Service Request
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
              A mandatory decline reason is required. This reason will be stored in MongoDB and notified to the user.
            </p>

            {declineError && (
              <div style={{ padding: '10px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                {declineError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Mandatory Reason for Decline *
              </label>
              <textarea
                className="modern-input"
                rows="4"
                placeholder="e.g. Site location does not meet security or accessibility requirements for 240L bin deployment."
                value={declineReasonText}
                onChange={(e) => setDeclineReasonText(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '10px', height: '100px' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-eco-secondary"
                onClick={() => setShowDeclineModal(false)}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-eco-primary"
                onClick={handleSubmitDeclineReason}
                style={{ background: '#DC2626', borderColor: '#DC2626', padding: '10px 18px', fontSize: '13px' }}
              >
                Decline Request »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL B: TECHNICAL WORKFORCE ASSIGNMENT MODAL (5-MIN TIMER ALERT)
          ========================================================================= */}
      {showWorkerAssignModal && assignTargetReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div className="soft-card" style={{ maxWidth: '540px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              TECHNICAL WORKFORCE ASSIGNMENT
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
              Assign Technical Worker to #{assignTargetReq.requestNumber}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.4' }}>
              Target Organization: <strong>{assignTargetReq.organizationName}</strong> ({assignTargetReq.numberOfBins} Bins in {assignTargetReq.town}). <br />
              Worker will have <strong style={{ color: '#D97706' }}>5 minutes</strong> to respond before assignment automatically expires.
            </p>

            {assignMessage && (
              <div style={{ padding: '12px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                {assignMessage}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Available Technical Worker (Real MongoDB Status)
              </label>
              <select
                className="modern-input"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                style={{ width: '100%', height: '46px' }}
              >
                <option value="">-- Choose Technical Staff --</option>
                {dbWorkers.map(w => (
                  <option key={w._id} value={w._id} disabled={w.workerStatus !== 'IDLE'}>
                    {w.fullName} (ID: {w.employeeId || 'T-100'}) — Status: {w.workerStatus} {w.workerStatus === 'IDLE' ? '[Available]' : '[Busy]'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Bins Quota Assigned to this Worker
              </label>
              <input
                type="number"
                className="modern-input"
                min="1"
                max={assignTargetReq.numberOfBins}
                value={binsQuota}
                onChange={(e) => setBinsQuota(parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', height: '44px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-eco-secondary"
                onClick={() => setShowWorkerAssignModal(false)}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-eco-primary"
                onClick={handleAssignWorkerSubmit}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Dispatch 5-Min Assignment »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ASSIGN TECHNICIAN CREW OVERLAY
          ========================================================================= */}
      {showTechModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
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
      {showCollectorAssignModal && selectedPickupToAssign && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div className="soft-card" style={{ maxWidth: '540px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              WASTE COLLECTION ASSIGNMENT
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
              Assign Collector to {selectedPickupToAssign.locationName || selectedPickupToAssign.site || selectedPickupToAssign.id}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.4' }}>
              Selected pickup: <strong>{selectedPickupToAssign.binId || selectedPickupToAssign.id}</strong> • Fill: <strong>{selectedPickupToAssign.fillLevel || 0}%</strong> • Urgency: <strong>{selectedPickupToAssign.urgency || 'Medium'}</strong>
            </p>

            {collectorAssignMessage && (
              <div style={{ padding: '12px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                {collectorAssignMessage}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Available Collector
              </label>
              <select
                className="modern-input"
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                style={{ width: '100%', height: '46px' }}
                aria-label="Select available collector"
              >
                <option value="">-- Choose Collector --</option>
                {dbCollectors.map(collector => {
                  const isBusy = collector.status === 'BUSY' || collector.workerStatus === 'BUSY' || (collector.activeTasksCount > 0);
                  return (
                    <option key={collector._id} value={collector._id}>
                      {collector.fullName} (ID: {collector.employeeId || 'C-101'}) — [{isBusy ? '🔴 BUSY (On Duty)' : '🟢 IDLE (Available)'}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-eco-secondary"
                onClick={() => setShowCollectorAssignModal(false)}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-eco-primary"
                onClick={handleCollectorAssignSubmit}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                Assign Collector »
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
