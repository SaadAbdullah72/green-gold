import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TECH_CREWS, LOGISTICS_PARTNERS, FACTORY_REPORTS } from '../mockData';
import { api } from '../api';
import DashboardAssistant from './DashboardAssistant';

const siteActivePinIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(4,120,87,0.25);"></div><div style="width:18px;height:18px;border-radius:50%;background:#047857;border:3px solid #FFFFFF;box-shadow:0 4px 12px rgba(0,0,0,0.35);position:relative;z-index:2;"></div></div>',
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
  const [selectedSiteId, setSelectedSiteId] = useState(null);
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

  // Waste Lifecycle & Transport States
  const [dbDumpRecords, setDbDumpRecords] = useState([]);
  const [dbTransporters, setDbTransporters] = useState([]);
  const [dbRecyclingPlants, setDbRecyclingPlants] = useState([]);
  const [dbTransportJobs, setDbTransportJobs] = useState([]);
  const [dbRecyclingReports, setDbRecyclingReports] = useState([]);
  const [dbWasteTracking, setDbWasteTracking] = useState(null);

  // Separation Modal State
  const [showSeparateModal, setShowSeparateModal] = useState(false);
  const [selectedDumpRecord, setSelectedDumpRecord] = useState(null);
  const [separatedWasteType, setSeparatedWasteType] = useState('Organic/Compost');
  const [separationNotes, setSeparationNotes] = useState('');
  const [separationMessage, setSeparationMessage] = useState('');

  // Transporter Assign Modal State
  const [showTransporterAssignModal, setShowTransporterAssignModal] = useState(false);
  const [selectedDumpToTransport, setSelectedDumpToTransport] = useState(null);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [transporterAssignMessage, setTransporterAssignMessage] = useState('');

  const loadManagementData = async (isInitial = false) => {
    try {
      const res = await api.management.getBootstrap();
      if (res && res.data) {
        const d = res.data;
        if (d.requests) setDbRequests(d.requests);
        if (d.workers) setDbWorkers(d.workers);
        if (d.collectors) setDbCollectors(d.collectors);
        if (d.collectionQueue) setDbCollectionQueue(d.collectionQueue);
        if (d.sites) {
          setDbActiveSites(d.sites);
          setSelectedSiteId(prevId => {
            if (prevId && d.sites.some(s => String(s.id || s._id) === String(prevId))) {
              return prevId;
            }
            return d.sites.length > 0 ? String(d.sites[0].id || d.sites[0]._id) : null;
          });
        }
        if (d.dumpRecords) setDbDumpRecords(d.dumpRecords);
        if (d.transporters) setDbTransporters(d.transporters);
        if (d.recyclingPlants) setDbRecyclingPlants(d.recyclingPlants);
        if (d.transportJobs) setDbTransportJobs(d.transportJobs);
        if (d.recyclingReports) setDbRecyclingReports(d.recyclingReports);
        if (d.wasteTracking) setDbWasteTracking(d.wasteTracking);
        if (d.auditLogs) setDbAuditLogs(d.auditLogs);

        // Cache for instant 0ms reload
        try {
          sessionStorage.setItem('greengold_mgmt_cache', JSON.stringify(d));
        } catch (e) {}
      }
    } catch (err) {
      if (err.message && (err.message.includes('Token') || err.message.includes('authorized'))) {
        if (onLogout) onLogout();
      }
    }
  };

  useEffect(() => {
    // Instant 0ms Cache Hydration
    try {
      const cached = sessionStorage.getItem('greengold_mgmt_cache');
      if (cached) {
        const d = JSON.parse(cached);
        if (d.requests) setDbRequests(d.requests);
        if (d.workers) setDbWorkers(d.workers);
        if (d.collectors) setDbCollectors(d.collectors);
        if (d.collectionQueue) setDbCollectionQueue(d.collectionQueue);
        if (d.sites) setDbActiveSites(d.sites);
        if (d.dumpRecords) setDbDumpRecords(d.dumpRecords);
        if (d.transportJobs) setDbTransportJobs(d.transportJobs);
        if (d.recyclingReports) setDbRecyclingReports(d.recyclingReports);
        if (d.wasteTracking) setDbWasteTracking(d.wasteTracking);
      }
    } catch (e) {}

    loadManagementData(true);
    const timer = setInterval(() => {
      loadManagementData(false);
    }, 4000);
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

  const [deletingSiteId, setDeletingSiteId] = useState(null);

  const handleDeleteActiveSite = async (e, site) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const siteName = site.organizationName || 'this site';
    const siteCode = site.clientCode || 'Active Site';
    if (!window.confirm(`⚠️ PERMANENT CASCADE PURGE:\nAre you sure you want to completely purge ${siteCode} (${siteName})?\n\nThis will permanently remove:\n- The User / Site Account\n- All Deployed Smart Bins\n- All Dump Yard Inflow Logs & Batches\n- All Dispatched Transport Jobs\n- All Minted Carbon Credits across all dashboards.`)) {
      return;
    }

    try {
      const targetId = String(site.id || site._id);
      setDeletingSiteId(targetId);
      await api.management.purgeUserAndData(targetId);
      setDbActiveSites(prev => prev.filter(s => String(s.id || s._id) !== targetId));
      if (String(selectedSiteId) === targetId) {
        setSelectedSiteId(null);
      }
      await loadManagementData();
    } catch (err) {
      alert(`Failed to purge site & user data: ${err.message}`);
    } finally {
      setDeletingSiteId(null);
    }
  };

  const handleDeleteDumpRecord = async (e, recordId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this dump batch record?')) return;
    try {
      await api.management.deleteDumpRecord(recordId);
      setDbDumpRecords(prev => prev.filter(r => String(r.id || r._id) !== String(recordId)));
      await loadManagementData();
    } catch (err) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  const handleClearAllDumpRecords = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL dump records from the central yard?')) return;
    try {
      await api.management.clearAllDumpRecords();
      setDbDumpRecords([]);
      await loadManagementData();
    } catch (err) {
      alert(`Clear Error: ${err.message}`);
    }
  };

  const handleDeleteTransportJob = async (e, jobId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this transport job?')) return;
    try {
      await api.management.deleteTransportJob(jobId);
      setDbTransportJobs(prev => prev.filter(j => String(j.id || j._id) !== String(jobId)));
      await loadManagementData();
    } catch (err) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  const handleClearAllTransportJobs = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL transport jobs?')) return;
    try {
      await api.management.clearAllTransportJobs();
      setDbTransportJobs([]);
      await loadManagementData();
    } catch (err) {
      alert(`Clear Error: ${err.message}`);
    }
  };

  const handleDeleteRecyclingReport = async (e, reportId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this recycling report and its minted carbon credits?')) return;
    try {
      await api.management.deleteRecyclingReport(reportId);
      setDbRecyclingReports(prev => prev.filter(r => String(r.id || r._id) !== String(reportId)));
      await loadManagementData();
    } catch (err) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  const handleClearAllRecyclingReports = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL recycling plant audit reports and reset carbon credit totals?')) return;
    try {
      await api.management.clearAllRecyclingReports();
      setDbRecyclingReports([]);
      await loadManagementData();
    } catch (err) {
      alert(`Clear Error: ${err.message}`);
    }
  };

  const handleSeparateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDumpRecord) return;
    try {
      const res = await api.management.separateDumpRecords({
        dumpRecordIds: [selectedDumpRecord.id || selectedDumpRecord._id],
        separatedType: separatedWasteType,
        notes: separationNotes
      });
      setSeparationMessage(res.message || 'Batch successfully classified!');
      setTimeout(() => {
        setShowSeparateModal(false);
        setSeparationMessage('');
      }, 1200);
      await loadManagementData();
    } catch (err) {
      alert(`Separation Error: ${err.message}`);
    }
  };

  const handleAssignTransporterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDumpToTransport || !selectedTransporterId || !selectedPlantId) {
      alert('Please select both a Transporter and a Destination Recycling Plant.');
      return;
    }
    try {
      const res = await api.management.assignTransportJob({
        dumpRecordIds: [selectedDumpToTransport.id || selectedDumpToTransport._id],
        transporterId: selectedTransporterId,
        recyclingPlantId: selectedPlantId
      });
      setTransporterAssignMessage(res.message || 'Transport dispatched successfully!');
      setTimeout(() => {
        setShowTransporterAssignModal(false);
        setTransporterAssignMessage('');
      }, 1200);
      await loadManagementData();
    } catch (err) {
      alert(`Transporter Assignment Error: ${err.message}`);
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

  // Live Dynamic KPI Calculations from Real Database State (No Double-Counting, Strict Exact Math)
  const liveStats = useMemo(() => {
    // 1. Total Active Bins in field from Active Deployed Sites
    let activeBinsCount = 0;
    if (dbActiveSites && dbActiveSites.length > 0) {
      activeBinsCount = dbActiveSites.reduce((sum, s) => sum + (s.numberOfBins || s.deployedBinIds?.length || 1), 0);
    }

    // 2. Stream weights from verified recycling reports
    let organicKg = 0;
    let plasticKg = 0;
    let metalKg = 0;
    let totalRecycledKg = 0;

    (dbRecyclingReports || []).forEach(r => {
      const out = Number(r.recycledWeightKg ?? r.recycledOutputKg ?? r.inputWeightKg ?? 0);
      const wt = (r.wasteType || '').toLowerCase();
      totalRecycledKg += out;
      if (wt.includes('plastic')) plasticKg += out;
      else if (wt.includes('metal')) metalKg += out;
      else if (wt.includes('organic') || wt.includes('compost')) organicKg += out;
    });

    // 3. Minted Carbon Credits directly from official Factory Reports
    let totalCC = 0;
    (dbRecyclingReports || []).forEach(r => {
      totalCC += Number(r.carbonCreditsGenerated || r.carbonCreditsMinted || 0);
    });

    // 4. Pending Yard/Transit Batches (not yet minted)
    let pendingDumpKg = 0;
    (dbDumpRecords || []).forEach(r => {
      if (r.status !== 'PROCESSED') {
        pendingDumpKg += Number(r.weightKg || 0);
      }
    });

    let pendingCC = pendingDumpKg > 0 ? Number((pendingDumpKg * 0.8).toFixed(2)) : 0;
    (safeBatchesAwaitingCert || []).forEach(b => {
      const credits = Number(b.carbonCreditsEarned || b.credits || (b.weightKg ? b.weightKg * 0.5 : 0));
      if (b.status === 'Certified' || b.status === 'Minted') {
        totalCC += credits;
      } else {
        pendingCC += credits;
      }
    });

    const avoidanceMt = Number(((organicKg * 0.00052) + (plasticKg * 0.00145) + (metalKg * 0.00210)).toFixed(3));

    return {
      activeBins: activeBinsCount,
      organicDivertedKg: Math.round(organicKg),
      totalCarbonCredits: Number(totalCC.toFixed(2)),
      avoidanceMt: avoidanceMt,
      pendingCC: Number(pendingCC.toFixed(2)),
      plasticRecoveredKg: Math.round(plasticKg),
      metalRecoveredKg: Math.round(metalKg),
      totalDivertedKg: Math.round(totalRecycledKg)
    };
  }, [dbActiveSites, dbDumpRecords, dbRecyclingReports, safeBatchesAwaitingCert]);

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
              1,257 Reward Points
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--primary)" strokeWidth="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <span className="pill-badge">
              Executive Authority
            </span>
          </div>
        </div>

        {/* KPI Indicators Grid */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {/* Gauge 1: Active provisions count */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>ACTIVE BINS IN FIELD</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.1', marginBottom: '8px' }}>{liveStats.activeBins}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across active client zones</div>
          </div>
          
          {/* Gauge 2: Organic Weight statistics */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>ORGANIC DIVERTED</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>{liveStats.organicDivertedKg.toLocaleString()} kg</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Processed into compost/fertilizer</div>
          </div>

          {/* Gauge 3: Minted carbon avoidance balance */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>MINTED CARBON CREDITS</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>
              {liveStats.totalCarbonCredits.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>CC</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Avoided: {Number(liveStats.avoidanceMt || 0).toFixed(3)} MT CO₂e (Pending: {liveStats.pendingCC.toFixed(2)} CC)
            </div>
          </div>

          {/* Gauge 4: Inorganic recovery sorting - Plastics */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>PLASTICS RECOVERED</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>{liveStats.plasticRecoveredKg.toLocaleString()} kg</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>EcoPak Facility Recycled</div>
          </div>

          {/* Gauge 5: Inorganic recovery sorting - Metal */}
          <div className="soft-card">
            <div className="kpi-title" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
              <span>METALS RECOVERED</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1', marginBottom: '8px' }}>{liveStats.metalRecoveredKg.toLocaleString()} kg</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>GreenTech Metal Facility</div>
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
          <button 
            className={`mgmt-tab-btn ${activeSubTab === 'waste_lifecycle' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('waste_lifecycle')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l5.1 5.1M4 4l5 5"></path></svg>
            Waste Lifecycle & Transporters
            {dbDumpRecords.filter(d => d.status === 'DUMPED' || d.status === 'SEPARATED').length > 0 && (
              <span className="badge-counter" style={{ marginLeft: '6px' }}>
                {dbDumpRecords.filter(d => d.status === 'DUMPED' || d.status === 'SEPARATED').length}
              </span>
            )}
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
                      {(() => {
                        const pendingBinRequests = dbRequests.filter(req => {
                          const s = String(req.status || '').toUpperCase();
                          return s !== 'COMPLETED' && s !== 'DECLINED' && s !== 'CANCELLED';
                        });
                        if (pendingBinRequests.length === 0) {
                          return (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                No pending bin deployment requests. All installed requests are in <strong>Active Sites Ledger</strong>.
                              </td>
                            </tr>
                          );
                        }

                        return pendingBinRequests.map(req => (
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
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* ACTIVE APPROVED DEPLOYMENTS & TECHNICAL TEAM STATUS TRACKER */}
                <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '2px dashed #E2E8F0' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '6px' }}>
                    Active Approved Deployments & Technical Team Status
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
                    Real-time status tracking for approved bin deployment requests currently being installed by field workforce.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {(() => {
                      const activeDeployingRequests = dbRequests.filter(r => {
                        const s = String(r.status || '').toUpperCase();
                        return ['APPROVED', 'ASSIGNING', 'ASSIGNED', 'IN_PROGRESS'].includes(s);
                      });

                      if (activeDeployingRequests.length === 0) {
                        return (
                          <div style={{ padding: '36px', background: '#F8FAFC', borderRadius: '16px', textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
                            No active approved bin deployment requests currently in field execution. (Completed requests are automatically moved to <strong>Active Sites Ledger</strong>).
                          </div>
                        );
                      }

                      return activeDeployingRequests.map(req => {
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
                                  {req.address}, {req.town}, {req.city}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: '#EFF6FF', color: '#1D4ED8' }}>
                                  Staffing: {totalAssigned}/{req.requiredWorkers || 1}
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
                      });
                    })()}
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
            SUB TAB VIEW 3: CARBON CREDIT MINTING & REGISTRY
            --------------------------------------------------------------------- */}
        {activeSubTab === 'carbon' && (
          <div className="mgmt-sub-view active">
            {/* Top Summary Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Carbon Minted</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                  {liveStats.totalCarbonCredits.toFixed(2)} <span style={{ fontSize: '14px' }}>CC</span>
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>● Minted on Registry</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avoided Mass (CO₂e)</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                  {Number(liveStats.avoidanceMt || 0).toFixed(3)} <span style={{ fontSize: '14px' }}>MT</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Certified Greenhouse Gas Avoidance</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certified Batches</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#3B82F6', marginTop: '4px' }}>
                  {dbRecyclingReports.length} {dbRecyclingReports.length === 1 ? 'Batch' : 'Batches'}
                </div>
                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700', marginTop: '2px' }}>Industrial Plant Audited</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beneficiary Clients</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>
                  {dbActiveSites.length} {dbActiveSites.length === 1 ? 'Client' : 'Clients'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Distributed to Portals</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Authenticated Carbon Credit Minting Registry ({dbRecyclingReports.length})
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Official immutable ledger of carbon credits generated per client waste generator, verified by partner recycling plants.
                  </div>
                </div>

                {dbRecyclingReports.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllRecyclingReports}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Minting Reports
                  </button>
                )}
              </div>

              {dbRecyclingReports.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>No Carbon Credits Minted Yet</div>
                  <div style={{ fontSize: '12px' }}>Once recycling plants verify and process delivered waste payloads, authenticated tokens will automatically appear on this ledger.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th style={{ padding: '12px' }}>Mint Code</th>
                        <th style={{ padding: '12px' }}>Origin Client (User)</th>
                        <th style={{ padding: '12px' }}>Recycling Plant</th>
                        <th style={{ padding: '12px' }}>Stream & Yield</th>
                        <th style={{ padding: '12px' }}>Minted Tokens</th>
                        <th style={{ padding: '12px' }}>Attested By</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbRecyclingReports.map((r) => {
                        const contrib = r.userContributions?.[0];
                        const clientName = contrib?.organizationName || (dbActiveSites[0]?.organizationName) || 'Saad Abdullah';
                        const clientCode = contrib?.clientCode || 'CLIENT-01';
                        return (
                          <tr key={r._id || r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#047857' }}>
                              {r.reportCode || 'REC-RPT-0101'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ color: '#0F172A' }}>{clientName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{clientCode}</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ color: '#047857' }}>{r.plantName}</strong>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  background: (r.wasteType || '').includes('Plastic') ? '#DBEAFE' : (r.wasteType || '').includes('Metal') ? '#FEF3C7' : '#DCFCE7',
                                  color: (r.wasteType || '').includes('Plastic') ? '#1E40AF' : (r.wasteType || '').includes('Metal') ? '#92400E' : '#166534'
                                }}>
                                  {r.wasteType}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                Recycled: <strong style={{ color: '#047857' }}>{r.recycledWeightKg} KG</strong> / {r.receivedWeightKg} KG ({r.recoveryEfficiencyPercent || 86}%)
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669' }}>
                                +{r.carbonCreditsGenerated} CC
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>Factor: {r.ccFactorUsed || 1.2} CC/kg</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: '700', color: '#334155' }}>{r.operatorName || 'Plant Inspector'}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                {r.processedAt ? new Date(r.processedAt).toLocaleString() : 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '900',
                                background: '#D1FAE5',
                                color: '#065F46',
                                textTransform: 'uppercase'
                              }}>
                                ✓ MINTED ON REGISTRY
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteRecyclingReport(e, r._id || r.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #FCA5A5',
                                  background: '#FFF1F2',
                                  color: '#BE123C',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                                title="Delete report"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 5: FACTORY PERFORMANCE & PROCESSING AUDIT REPORTS
            --------------------------------------------------------------------- */}
        {activeSubTab === 'factory' && (
          <div className="mgmt-sub-view active">
            {/* Top 3 Plant Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { name: 'Pak Recycling Ltd', type: 'Organic/Compost', address: 'Plot 42, Sector I-9/2', capacity: '80 Tons' },
                { name: 'EcoPak Plastics Recycling Facility', type: 'Plastic', address: 'Industrial Triangle, Kahuta Road', capacity: '60 Tons' },
                { name: 'GreenTech Metal & Materials Recovery', type: 'Metal', address: 'Plot 18, Sector I-10/3', capacity: '100 Tons' }
              ].map((fac, fIdx) => {
                const plantReports = dbRecyclingReports.filter(r => (r.plantName || '').toLowerCase().includes(fac.type.toLowerCase()) || (r.wasteType || '').toLowerCase().includes(fac.type.toLowerCase()));
                const plantRepurposedKg = plantReports.reduce((sum, r) => sum + Number(r.recycledWeightKg || 0), 0);
                const plantCarbonCC = plantReports.reduce((sum, r) => sum + Number(r.carbonCreditsGenerated || 0), 0);

                return (
                  <div key={fIdx} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fac.type} Facility</span>
                        <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{fac.name}</h4>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', background: '#D1FAE5', color: '#065F46' }}>OPERATIONAL</span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '14px' }}>{fac.address} • Cap: {fac.capacity}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Waste Repurposed</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#047857' }}>{plantRepurposedKg.toFixed(1)} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Carbon Yield</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>+{plantCarbonCC.toFixed(2)} CC</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Factory Processing Audit Log Table */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Industrial Plant Processing Audit Reports ({dbRecyclingReports.length})
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Real-time waste transformation flows from client origin sites to industrial recycling facilities.
                  </div>
                </div>
              </div>

              {dbRecyclingReports.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>No Factory Audit Reports Yet</div>
                  <div style={{ fontSize: '12px' }}>Delivered transporter loads verified by plant operators will generate recovery metrics and waste flow logs here.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th style={{ padding: '12px' }}>Audit Code</th>
                        <th style={{ padding: '12px' }}>Recycling Plant</th>
                        <th style={{ padding: '12px' }}>Origin Client (Site)</th>
                        <th style={{ padding: '12px' }}>Waste Stream</th>
                        <th style={{ padding: '12px' }}>Inflow (KG)</th>
                        <th style={{ padding: '12px' }}>Recycled Yield</th>
                        <th style={{ padding: '12px' }}>Efficiency</th>
                        <th style={{ padding: '12px' }}>Carbon Saved</th>
                        <th style={{ padding: '12px' }}>Inspector & Date</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbRecyclingReports.map((r) => {
                        const contrib = r.userContributions?.[0];
                        const clientName = contrib?.organizationName || (dbActiveSites[0]?.organizationName) || 'Saad Abdullah';
                        return (
                          <tr key={r._id || r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#047857' }}>
                              {r.reportCode || 'REC-RPT-0101'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '700', color: '#0F172A' }}>
                              {r.plantName}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ color: '#0F172A' }}>{clientName}</strong>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '800',
                                background: (r.wasteType || '').includes('Plastic') ? '#DBEAFE' : (r.wasteType || '').includes('Metal') ? '#FEF3C7' : '#DCFCE7',
                                color: (r.wasteType || '').includes('Plastic') ? '#1E40AF' : (r.wasteType || '').includes('Metal') ? '#92400E' : '#166534'
                              }}>
                                {r.wasteType}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '800' }}>
                              {r.receivedWeightKg} KG
                            </td>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#047857' }}>
                              {r.recycledWeightKg} KG
                            </td>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#3B82F6' }}>
                              {r.recoveryEfficiencyPercent || 86}%
                            </td>
                            <td style={{ padding: '12px', fontWeight: '900', color: '#059669' }}>
                              +{r.carbonCreditsGenerated} CC
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: '700', color: '#334155' }}>{r.operatorName || 'Haji Rafiq'}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                {r.processedAt ? new Date(r.processedAt).toLocaleString() : 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteRecyclingReport(e, r._id || r.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #FCA5A5',
                                  background: '#FFF1F2',
                                  color: '#BE123C',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                                title="Delete audit report"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                  {dbActiveSites.length} {dbActiveSites.length === 1 ? 'Site' : 'Sites'}
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '2px' }}>● Provisioned & Verified</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployed Smart Bins</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                  {dbActiveSites.reduce((acc, s) => acc + (s.numberOfBins || 1), 0)} Units
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Allotted Standard Bins</div>
              </div>

              <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetry Connectivity</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#3B82F6', marginTop: '4px' }}>100% Online</div>
                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700', marginTop: '2px' }}>Proteus Bridge Sync Active</div>
              </div>
            </div>

            {/* Split Screen: Left Cards List | Right Interactive Map & Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Client Sites List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Provisioned Client Facilities ({dbActiveSites.length})
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
                    Click a client to view location map
                  </span>
                </div>

                {dbActiveSites.length === 0 ? (
                  <div style={{ padding: '40px 24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>No Active Deployed Sites Yet</div>
                    <div style={{ fontSize: '12px' }}>Once technical staff completes an installation, the deployed client site and its allotted bins will appear here automatically.</div>
                  </div>
                ) : (() => {
                  const activeSelectedSite = (selectedSiteId ? dbActiveSites.find(s => String(s.id || s._id) === String(selectedSiteId)) : null) || (dbActiveSites.length > 0 ? dbActiveSites[0] : null);

                  return dbActiveSites.map((site) => {
                    const siteKey = String(site.id || site._id);
                    const isSelected = activeSelectedSite && String(activeSelectedSite.id || activeSelectedSite._id) === siteKey;
                    const binList = site.deployedBinIds || [`${site.binPrefix || 'BIN-01'}-01`];
                    const isDeleting = deletingSiteId === siteKey;

                    return (
                      <div
                        key={siteKey}
                        onClick={() => setSelectedSiteId(siteKey)}
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
                              {site.address}, {site.town}, {site.city}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: '#D1FAE5',
                              color: '#065F46'
                            }}>
                              ACTIVE
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteActiveSite(e, site); }}
                              disabled={isDeleting}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Remove site from active deployments"
                            >
                              {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
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
                                ID: {bId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Right Column: Selected Site Interactive Map & Deep Inspection */}
              <div style={{ position: 'sticky', top: '20px' }}>
                {(() => {
                  const currentSite = (selectedSiteId ? dbActiveSites.find(s => String(s.id || s._id) === String(selectedSiteId)) : null) || (dbActiveSites && dbActiveSites.length > 0 ? dbActiveSites[0] : null);

                  if (!currentSite) {
                    return (
                      <div style={{ background: '#FFFFFF', padding: '40px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>No Site Selected</div>
                        <div style={{ fontSize: '12px' }}>Complete a smart bin installation to inspect its live GPS location and telemetries.</div>
                      </div>
                    );
                  }

                  const currentLat = currentSite.lat || 33.7206;
                  const currentLng = currentSite.lng || 73.1070;
                  const currentKey = String(currentSite.id || currentSite._id);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#065F46' }}>
                            GPS: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteActiveSite(e, currentSite)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #FCA5A5',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            title="Remove this site"
                          >
                            Remove Site
                          </button>
                        </div>
                      </div>

                      {/* Map Container - Keyed by current site ID to force instant remount and correct coordinates */}
                      <div style={{ height: '320px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '18px' }}>
                        <MapContainer
                          key={currentKey}
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

        {/* ---------------------------------------------------------------------
            SUB TAB VIEW 6: WASTE LIFECYCLE, SEPARATION & TRANSPORTER FLEET
            --------------------------------------------------------------------- */}
        {activeSubTab === 'waste_lifecycle' && (
          <div className="mgmt-sub-view active">
            
            {/* Top Waste Tracking Summary Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Central Yard Dumped</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#D97706', marginTop: '4px' }}>
                  {dbDumpRecords.reduce((sum, d) => sum + (d.weightKg || 0), 0).toFixed(1)} <span style={{ fontSize: '13px' }}>KG</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{dbDumpRecords.length} collection lots dumped</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Separated & Ready</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284C7', marginTop: '4px' }}>
                  {dbDumpRecords.filter(d => d.status === 'SEPARATED').length} <span style={{ fontSize: '13px' }}>Lots</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Classified into organic/plastic/metal</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>In Transit (Transporters)</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                  {dbTransportJobs.filter(j => j.status === 'IN_TRANSIT' || j.status === 'ASSIGNED' || j.status === 'ACCEPTED').length} <span style={{ fontSize: '13px' }}>Hauls</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>En route to industrial plants</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Minted Carbon Credits</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                  {dbRecyclingReports.reduce((sum, r) => sum + (r.carbonCreditsGenerated || 0), 0).toFixed(2)} <span style={{ fontSize: '13px' }}>CC</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Distributed to customer portals</div>
              </div>
            </div>

            {/* Section 1: Central Dump Yard & Sorting Ledger */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Central Dump Yard & Material Separation Ledger ({dbDumpRecords.length})
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Track all waste payloads dumped by collectors, separate by material type, and dispatch with transporters.
                  </div>
                </div>

                {dbDumpRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllDumpRecords}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Dump Records
                  </button>
                )}
              </div>

              {dbDumpRecords.length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                  No dump records recorded yet. Complete a collector pickup to see batches arrive at the Central Dump Yard.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th style={{ padding: '12px' }}>Client / Facility</th>
                        <th style={{ padding: '12px' }}>Location</th>
                        <th style={{ padding: '12px' }}>Weight</th>
                        <th style={{ padding: '12px' }}>Material Stream</th>
                        <th style={{ padding: '12px' }}>Collector</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbDumpRecords.map((rec) => (
                        <tr key={rec.id || rec._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: '#0F172A' }}>{rec.organizationName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.clientCode} • Bin: {rec.binId}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {rec.address}, {rec.town}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '800', color: '#047857' }}>
                            {rec.weightKg} KG
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: rec.wasteType === 'Plastic' ? '#EFF6FF' : rec.wasteType === 'Metal' ? '#F3E8FF' : '#ECFDF5',
                              color: rec.wasteType === 'Plastic' ? '#1E40AF' : rec.wasteType === 'Metal' ? '#6B21A8' : '#065F46'
                            }}>
                              {rec.wasteType}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {rec.collectorName}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: rec.status === 'PROCESSED' ? '#D1FAE5' : rec.status === 'SEPARATED' ? '#E0F2FE' : rec.status === 'IN_TRANSIT' ? '#FEF3C7' : '#F1F5F9',
                              color: rec.status === 'PROCESSED' ? '#065F46' : rec.status === 'SEPARATED' ? '#0369A1' : rec.status === 'IN_TRANSIT' ? '#92400E' : '#475569'
                            }}>
                              {rec.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                              {rec.status === 'DUMPED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDumpRecord(rec);
                                    setSeparatedWasteType(rec.wasteType || 'Organic/Compost');
                                    setSeparationNotes('');
                                    setShowSeparateModal(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #0284C7',
                                    background: '#F0F9FF',
                                    color: '#0284C7',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Separate Stream ✂️
                                </button>
                              )}

                              {rec.status === 'SEPARATED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDumpToTransport(rec);
                                    setSelectedTransporterId('');
                                    setSelectedPlantId('');
                                    setShowTransporterAssignModal(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#047857',
                                    color: '#FFFFFF',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Dispatch Transporter 🚚
                                </button>
                              )}

                              {(rec.status === 'IN_TRANSIT' || rec.status === 'ASSIGNED_TRANSPORT' || rec.status === 'DELIVERED') && (
                                <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '700' }}>
                                  En Route to Plant
                                </span>
                              )}

                              {rec.status === 'PROCESSED' && (
                                <span style={{ fontSize: '11px', color: '#047857', fontWeight: '800' }}>
                                  ✓ Recycled & Minted
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteDumpRecord(e, rec.id || rec._id)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #FCA5A5',
                                  background: '#FFF1F2',
                                  color: '#BE123C',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                                title="Delete dump batch"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Active Inter-Facility Transport Dispatches */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  Inter-Facility Transporter Hauls ({dbTransportJobs.length})
                </h3>
                {dbTransportJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTransportJobs}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Transport Jobs
                  </button>
                )}
              </div>

              {dbTransportJobs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                  No transport dispatches active.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                      <th style={{ padding: '10px' }}>Job Code</th>
                      <th style={{ padding: '10px' }}>Transporter Driver</th>
                      <th style={{ padding: '10px' }}>Vehicle</th>
                      <th style={{ padding: '10px' }}>Destination Plant</th>
                      <th style={{ padding: '10px' }}>Waste Stream</th>
                      <th style={{ padding: '10px' }}>Payload</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbTransportJobs.map((j) => (
                      <tr key={j.id || j._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px', fontWeight: '800', color: '#047857' }}>{j.jobCode}</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{j.transporterName}</td>
                        <td style={{ padding: '10px', color: '#64748B' }}>{j.vehicleNumber}</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{j.plantName}</td>
                        <td style={{ padding: '10px' }}>{j.wasteType}</td>
                        <td style={{ padding: '10px', fontWeight: '800' }}>{j.totalWeightKg} KG</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: j.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7', color: j.status === 'COMPLETED' ? '#065F46' : '#92400E' }}>
                            {j.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTransportJob(e, j.id || j._id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #FCA5A5',
                              background: '#FFF1F2',
                              color: '#BE123C',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                            title="Delete transport job"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section 3: Per-Customer Lifetime Waste & Carbon Offset Ledger */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                Client Facility Waste Generation & Carbon Credit Aggregates
              </h3>
              {(!dbWasteTracking || !dbWasteTracking.userSummaries || dbWasteTracking.userSummaries.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                  No customer aggregations computed yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                      <th style={{ padding: '10px' }}>Organization Client</th>
                      <th style={{ padding: '10px' }}>Client ID</th>
                      <th style={{ padding: '10px' }}>Total Dumped (KG)</th>
                      <th style={{ padding: '10px' }}>Total Recycled (KG)</th>
                      <th style={{ padding: '10px' }}>Carbon Credits Earned</th>
                      <th style={{ padding: '10px' }}>Recycling Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbWasteTracking.userSummaries.map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px', fontWeight: '800', color: '#0F172A' }}>{u.organizationName}</td>
                        <td style={{ padding: '10px', color: '#64748B' }}>{u.clientCode}</td>
                        <td style={{ padding: '10px', fontWeight: '800' }}>{u.totalDumpedKg} KG</td>
                        <td style={{ padding: '10px', fontWeight: '800', color: '#047857' }}>{u.totalRecycledKg} KG</td>
                        <td style={{ padding: '10px', fontWeight: '900', color: '#059669' }}>+{u.totalCarbonCredits} CC</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{u.recyclingRatePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

      {/* =========================================================================
          MODAL D: WASTE SEPARATION & STREAM CLASSIFICATION MODAL
          ========================================================================= */}
      {showSeparateModal && selectedDumpRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div className="soft-card" style={{ maxWidth: '520px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase' }}>Central Yard Processing</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>Separate Waste Stream</h3>
              </div>
              <button type="button" onClick={() => setShowSeparateModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Origin Client:</span>
                <strong>{selectedDumpRecord.organizationName} ({selectedDumpRecord.clientCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Gross Weight:</span>
                <strong style={{ color: '#047857', fontSize: '14px' }}>{selectedDumpRecord.weightKg} KG</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Dump Location:</span>
                <span>{selectedDumpRecord.address}</span>
              </div>
            </div>

            {separationMessage && (
              <div style={{ padding: '10px', background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
                {separationMessage}
              </div>
            )}

            <form onSubmit={handleSeparateSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Select Target Recycling Stream *
                </label>
                <select
                  className="modern-input"
                  value={separatedWasteType}
                  onChange={(e) => setSeparatedWasteType(e.target.value)}
                  style={{ width: '100%', height: '46px', fontWeight: '700' }}
                >
                  <option value="Organic/Compost">Organic / Food Biomass (Pak Recycling Ltd)</option>
                  <option value="Plastic">Plastic & Polymers (EcoPak Plastics)</option>
                  <option value="Metal">Scrap Metal & Cans (GreenTech Metal)</option>
                  <option value="General Mixed">General Mixed Secondary Waste</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Yard Separation Notes / Quality Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Segregated cleanly into Food Waste Bin Batch A"
                  value={separationNotes}
                  onChange={(e) => setSeparationNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSeparateModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0284C7', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Classify & Prepare for Dispatch »
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL E: ASSIGN TRANSPORTER & DISPATCH TO RECYCLING PLANT
          ========================================================================= */}
      {showTransporterAssignModal && selectedDumpToTransport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div className="soft-card" style={{ maxWidth: '540px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Logistics Dispatch Command</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>Assign Transporter Haul</h3>
              </div>
              <button type="button" onClick={() => setShowTransporterAssignModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Cargo Stream:</span>
                <strong style={{ color: '#047857' }}>{selectedDumpToTransport.wasteType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Cargo Payload:</span>
                <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedDumpToTransport.weightKg} KG</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Origin Generator:</span>
                <span>{selectedDumpToTransport.organizationName}</span>
              </div>
            </div>

            {transporterAssignMessage && (
              <div style={{ padding: '10px', background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
                {transporterAssignMessage}
              </div>
            )}

            <form onSubmit={handleAssignTransporterSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Select Transporter Carrier Vehicle *
                </label>
                <select
                  className="modern-input"
                  required
                  value={selectedTransporterId}
                  onChange={(e) => setSelectedTransporterId(e.target.value)}
                  style={{ width: '100%', height: '46px', fontWeight: '700' }}
                >
                  <option value="">-- Choose Transporter Carrier --</option>
                  {dbTransporters.map(t => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      {t.fullName} (Vehicle: {t.vehicleNumber}) — [{t.workerStatus === 'BUSY' ? '🔴 BUSY' : '🟢 AVAILABLE'}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Select Destination Recycling Plant *
                </label>
                <select
                  className="modern-input"
                  required
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  style={{ width: '100%', height: '46px', fontWeight: '700' }}
                >
                  <option value="">-- Choose Destination Facility --</option>
                  {dbRecyclingPlants.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name} [{p.plantType}] — {p.address}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowTransporterAssignModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#047857', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Dispatch Transport Haul »
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
