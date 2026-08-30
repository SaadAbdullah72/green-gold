import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconBrandLogo } from './Icons';

// Formal Custom Map Pin Markers
const yardIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#047857;border:3px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const plantIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#1E3A8A;border:3px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function DumpingFacilityDashboard({ onLogout }) {
  const { user, logout } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [records, setRecords] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [plants, setPlants] = useState([]);
  const [transportJobs, setTransportJobs] = useState([]);

  // Top Category Filter Dropdown
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL'); // 'ALL', 'Plastic', 'Metal', 'Organic/Compost', 'General Mixed'

  // Selected Active Site
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Dispatch Form State
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('SITES'); // 'SITES', 'DISPATCH', 'INVENTORY', 'LOGISTICS_MAP'

  // Notification Toast
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [analyticsRes, recordsRes, trnRes, plantRes, jobsRes] = await Promise.all([
        api.dumpFacility.getAnalytics().catch(() => ({ success: false })),
        api.dumpFacility.getRecords().catch(() => ({ success: false })),
        api.dumpFacility.getTransporters().catch(() => ({ success: false })),
        api.dumpFacility.getRecyclingPlants().catch(() => ({ success: false })),
        api.dumpFacility.getTransportJobs().catch(() => ({ success: false }))
      ]);

      if (analyticsRes.success) {
        setAnalytics(analyticsRes);
        if (!selectedSiteId && analyticsRes.sites && analyticsRes.sites.length > 0) {
          setSelectedSiteId(analyticsRes.sites[0].siteId || analyticsRes.sites[0].organizationName);
        }
      }
      if (recordsRes.success) setRecords(recordsRes.records || []);
      if (trnRes.success) setTransporters(trnRes.transporters || []);
      if (plantRes.success) {
        setPlants(plantRes.plants || []);
        if (!selectedPlantId && plantRes.plants.length > 0) {
          setSelectedPlantId(plantRes.plants[0]._id || plantRes.plants[0].id);
        }
      }
      if (jobsRes.success) setTransportJobs(jobsRes.jobs || []);

      // Cache to sessionStorage for 0ms instant reload
      try {
        sessionStorage.setItem('greengold_dump_cache', JSON.stringify({
          analytics: analyticsRes.success ? analyticsRes : null,
          records: recordsRes.success ? recordsRes.records : [],
          plants: plantRes.success ? plantRes.plants : [],
          transporters: trnRes.success ? trnRes.transporters : [],
          jobs: jobsRes.success ? jobsRes.jobs : []
        }));
      } catch (e) {}
    } catch (err) {
      showMsg('error', 'Error synchronizing facility data: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSiteId, selectedPlantId]);

  useEffect(() => {
    // Instant 0ms cache hydration
    try {
      const cached = sessionStorage.getItem('greengold_dump_cache');
      if (cached) {
        const d = JSON.parse(cached);
        if (d.analytics) setAnalytics(d.analytics);
        if (d.records) setRecords(d.records);
        if (d.plants) setPlants(d.plants);
        if (d.transporters) setTransporters(d.transporters);
        if (d.jobs) setTransportJobs(d.jobs);
        setLoading(false);
      }
    } catch (e) {}

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Enrolled Active Sites (100% Synced with Admin Active Deployed Sites Ledger)
  const enrolledSites = useMemo(() => {
    return analytics?.sites || [];
  }, [analytics]);

  // Currently Selected Site
  const currentSite = useMemo(() => {
    if (!selectedSiteId && enrolledSites.length > 0) return enrolledSites[0];
    return enrolledSites.find(s => s.siteId === selectedSiteId || s.organizationName === selectedSiteId) || enrolledSites[0] || null;
  }, [selectedSiteId, enrolledSites]);

  // Filtered records based on top category dropdown
  const categoryFilteredRecords = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return records;
    return records.filter(r => {
      const st = (r.wasteType || r.separatedType || '').toLowerCase();
      const target = selectedCategoryFilter.toLowerCase();
      if (target.includes('organic')) return st.includes('organic') || st.includes('compost');
      return st.includes(target);
    });
  }, [records, selectedCategoryFilter]);

  // Filtered records for the selected site
  const siteInflowRecords = useMemo(() => {
    if (!currentSite) return [];
    const siteName = (currentSite.organizationName || currentSite.siteName || '').toLowerCase();
    const siteTown = (currentSite.town || '').toLowerCase();

    return records.filter(r => {
      const matchSite = (r.organizationName || '').toLowerCase().includes(siteName) || (r.town || '').toLowerCase() === siteTown;
      if (!matchSite) return false;

      if (selectedCategoryFilter !== 'ALL') {
        const st = (r.wasteType || r.separatedType || '').toLowerCase();
        const target = selectedCategoryFilter.toLowerCase();
        if (target.includes('organic')) return st.includes('organic') || st.includes('compost');
        return st.includes(target);
      }
      return true;
    });
  }, [currentSite, records, selectedCategoryFilter]);

  // Undispatched Ready Batches
  const readyRecords = useMemo(() => {
    return categoryFilteredRecords.filter(r => r.status === 'DUMPED' || r.status === 'SEPARATED');
  }, [categoryFilteredRecords]);

  // Record selection toggle
  const toggleSelectRecord = (id) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllReady = () => {
    if (selectedRecordIds.length === readyRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(readyRecords.map(r => r._id || r.id));
    }
  };

  // Selected Plant for Route Guide
  const currentSelectedPlant = useMemo(() => {
    return plants.find(p => String(p._id || p.id) === String(selectedPlantId)) || plants[0] || null;
  }, [plants, selectedPlantId]);

  // Auto-match Recycling Plant on stream selection
  const handleAutoSelectPlant = (streamType) => {
    if (!plants || plants.length === 0) return;
    const norm = streamType.toLowerCase();
    let matched = null;
    if (norm.includes('plastic')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('plastic') || (p.organizationName || '').toLowerCase().includes('plastic'));
    } else if (norm.includes('metal')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('metal') || (p.organizationName || '').toLowerCase().includes('metal'));
    } else if (norm.includes('organic') || norm.includes('compost')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('organic') || (p.organizationName || '').toLowerCase().includes('pak'));
    }
    if (matched) {
      setSelectedPlantId(matched._id || matched.id);
    }
  };

  // Perform Transporter Dispatch
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      showMsg('error', 'Please select at least one waste batch to dispatch.');
      return;
    }
    if (!selectedTransporterId) {
      showMsg('error', 'Please select an available Transporter driver.');
      return;
    }
    if (!selectedPlantId) {
      showMsg('error', 'Please select a destination Recycling Plant.');
      return;
    }

    try {
      setDispatching(true);
      const res = await api.dumpFacility.dispatchTransporter({
        dumpRecordIds: selectedRecordIds,
        transporterId: selectedTransporterId,
        recyclingPlantId: selectedPlantId,
        notes: dispatchNotes
      });

      showMsg('success', res.message || 'Transporter dispatched successfully with route map!');
      setSelectedRecordIds([]);
      setDispatchNotes('');
      loadData();
    } catch (err) {
      showMsg('error', err.message || 'Dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  const handleDeleteRecord = async (e, recordId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this waste batch record from the yard?')) return;
    try {
      await api.dumpFacility.deleteRecord(recordId);
      showMsg('success', 'Waste batch record deleted successfully.');
      loadData();
    } catch (err) {
      showMsg('error', 'Failed to delete record: ' + err.message);
    }
  };

  const handleClearAllRecords = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL dump records and batch logs in the central facility?')) return;
    try {
      await api.dumpFacility.clearAllRecords();
      showMsg('success', 'All facility dump records cleared.');
      loadData();
    } catch (err) {
      showMsg('error', 'Failed to clear records: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', fontFamily: 'Times New Roman, serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#047857' }}>
            GreenGold OS — Central Waste Dumping Facility
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
            Synchronizing live active ledgers and recycling plant routes...
          </div>
        </div>
      </div>
    );
  }

  const totals = analytics?.totals || {};
  const DUMP_FACILITY_COORDS = [33.6660, 73.0410]; // Sector I-9/1 Industrial Hub, Islamabad
  const plantCoords = currentSelectedPlant?.coords || [33.6628, 73.0489];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF6', fontFamily: 'Times New Roman, serif', color: '#0F172A', paddingBottom: '60px' }}>
      
      {/* 1. TOP PROFESSIONAL HEADER (Theme matched with Management, Collector, and Transporter) */}
      <header style={{
        background: '#047857',
        color: '#FFFFFF',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(4,120,87,0.2)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.png" alt="GreenGold Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A7F3D0', fontWeight: 800 }}>
              INTER-MUNICIPAL RESOURCE CONVERGENCE & RECYCLING DISPATCH
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
              GreenGold OS — Central Waste Dumping & Separation Facility
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#FFFFFF' }}>
            <div style={{ fontWeight: 800, color: '#FFFFFF' }}>{user?.fullName || 'Supervisor Rashid Mahmood'}</div>
            <div style={{ color: '#E2E8F0', marginTop: '2px' }}>Facility ID: <strong style={{ color: '#FFFFFF' }}>DUMP-101</strong> (Sector I-9/1 Industrial Hub)</div>
          </div>

          <button
            onClick={loadData}
            disabled={refreshing}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>

          <button
            onClick={handleClearAllRecords}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #F87171',
              background: '#991B1B',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Clear all yard dump records"
          >
            Clear All Logs
          </button>

          <button
            onClick={() => { logout(); if (onLogout) onLogout(); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {message.text && (
        <div style={{
          maxWidth: '1440px',
          margin: '14px auto 0',
          padding: '10px 20px',
          borderRadius: '8px',
          background: message.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: message.type === 'error' ? '#991B1B' : '#166534',
          border: `1px solid ${message.type === 'error' ? '#F87171' : '#86EFAC'}`,
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1440px', margin: '20px auto', padding: '0 24px' }}>

        {/* 2. TOP TOTAL DUMPED INFLOW & CATEGORY SELECTION BAR */}
        <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                OVERALL FACILITY DUMPED INFLOW
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                {(totals.totalDumpedKg || 0).toLocaleString()} <span style={{ fontSize: '18px', fontWeight: 700, color: '#475569' }}>KG</span>
              </div>
            </div>

            {/* Category Dropdown Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                Filter by Waste Category:
              </label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '2px solid #047857',
                  background: '#F0FDF4',
                  color: '#047857',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  minWidth: '260px'
                }}
              >
                <option value="ALL">All Categories (Combined Overview)</option>
                <option value="Plastic">Plastic Waste (EcoPak Facility)</option>
                <option value="Metal">Metal Scrap Waste (GreenTech Facility)</option>
                <option value="Organic/Compost">Organic / Compost (Pak Recycling Ltd)</option>
                <option value="General Mixed">General / Mixed Waste</option>
              </select>
            </div>
          </div>

          {/* 4 Category Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div
              onClick={() => setSelectedCategoryFilter('Plastic')}
              style={{
                background: selectedCategoryFilter === 'Plastic' ? '#EFF6FF' : '#F8FAFC',
                padding: '14px 18px',
                borderRadius: '8px',
                border: selectedCategoryFilter === 'Plastic' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF' }}>PLASTIC WASTE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#1D4ED8', marginTop: '4px' }}>
                {(totals.totalPlasticKg || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700 }}>KG</span>
              </div>
              <div style={{ fontSize: '11px', color: '#3B82F6', marginTop: '2px' }}>Destination: EcoPak Plastics (Kahuta Rd)</div>
            </div>

            <div
              onClick={() => setSelectedCategoryFilter('Metal')}
              style={{
                background: selectedCategoryFilter === 'Metal' ? '#FEF3C7' : '#F8FAFC',
                padding: '14px 18px',
                borderRadius: '8px',
                border: selectedCategoryFilter === 'Metal' ? '2px solid #D97706' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>METAL WASTE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>
                {(totals.totalMetalKg || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700 }}>KG</span>
              </div>
              <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>Destination: GreenTech Metal (Sector I-10/3)</div>
            </div>

            <div
              onClick={() => setSelectedCategoryFilter('Organic/Compost')}
              style={{
                background: selectedCategoryFilter === 'Organic/Compost' ? '#ECFDF5' : '#F8FAFC',
                padding: '14px 18px',
                borderRadius: '8px',
                border: selectedCategoryFilter === 'Organic/Compost' ? '2px solid #047857' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#065F46' }}>ORGANIC / COMPOST</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
                {(totals.totalOrganicKg || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700 }}>KG</span>
              </div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Destination: Pak Recycling Ltd (Sector I-9/2)</div>
            </div>

            <div
              onClick={() => setSelectedCategoryFilter('General Mixed')}
              style={{
                background: selectedCategoryFilter === 'General Mixed' ? '#F1F5F9' : '#F8FAFC',
                padding: '14px 18px',
                borderRadius: '8px',
                border: selectedCategoryFilter === 'General Mixed' ? '2px solid #64748B' : '1px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>GENERAL MIXED</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#334155', marginTop: '4px' }}>
                {(totals.totalMixedKg || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700 }}>KG</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Pending Stream Classification</div>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION SECTION TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('SITES')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'SITES' ? '#047857' : '#E2E8F0',
              color: activeTab === 'SITES' ? '#FFFFFF' : '#334155',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Active Deployed Sites Ledger ({enrolledSites.length})
          </button>

          <button
            onClick={() => setActiveTab('DISPATCH')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'DISPATCH' ? '#047857' : '#E2E8F0',
              color: activeTab === 'DISPATCH' ? '#FFFFFF' : '#334155',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Transporter Dispatch & Route Assignment ({readyRecords.length} Ready)
          </button>

          <button
            onClick={() => setActiveTab('LOGISTICS_MAP')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'LOGISTICS_MAP' ? '#047857' : '#E2E8F0',
              color: activeTab === 'LOGISTICS_MAP' ? '#FFFFFF' : '#334155',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Interactive Plant Route Guide (Leaflet Map)
          </button>

          <button
            onClick={() => setActiveTab('INVENTORY')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'INVENTORY' ? '#047857' : '#E2E8F0',
              color: activeTab === 'INVENTORY' ? '#FFFFFF' : '#334155',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Master Dump Inventory Log ({records.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ACTIVE DEPLOYED SITES LEDGER (Synced 100% with Admin)             */}
        {/* ========================================================================= */}
        {activeTab === 'SITES' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left Column: List of Active Deployed Sites from Admin Ledger */}
            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Active Deployed Sites (Admin Ledger)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {enrolledSites.map((site, sIdx) => {
                  const isSelected = String(currentSite?.siteId) === String(site.siteId) || currentSite?.organizationName === site.organizationName;
                  return (
                    <div
                      key={sIdx}
                      onClick={() => setSelectedSiteId(site.siteId || site.organizationName)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #047857' : '1px solid #E2E8F0',
                        background: isSelected ? '#ECFDF5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? '#047857' : '#1E293B' }}>
                        {site.organizationName || site.siteName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {site.address ? `${site.address}, ` : ''}{site.town}
                      </div>
                      <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px', fontWeight: 800 }}>
                        Total Dumped: {site.totalKg || 0} KG
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detailed View for Selected Site */}
            {currentSite && (
              <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Site Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#047857', fontWeight: 800 }}>
                      {currentSite.organizationName || currentSite.siteName}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      Location: <strong>{currentSite.address || 'Capital Area'}</strong>, {currentSite.town}, {currentSite.city}
                    </div>
                    {currentSite.contactPerson && (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        Contact Person: {currentSite.contactPerson} {currentSite.phone ? `(${currentSite.phone})` : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#F0FDF4', padding: '10px 18px', borderRadius: '8px', border: '1px solid #A7F3D0', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 800 }}>SITE TOTAL DUMPED</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857' }}>{currentSite.totalKg || 0} KG</div>
                  </div>
                </div>

                {/* Site Category Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 800 }}>PLASTIC TOTAL</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1D4ED8', marginTop: '2px' }}>{currentSite.plasticKg || 0} KG</div>
                  </div>

                  <div style={{ background: '#FEF3C7', padding: '12px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 800 }}>METAL TOTAL</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#B45309', marginTop: '2px' }}>{currentSite.metalKg || 0} KG</div>
                  </div>

                  <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 800 }}>ORGANIC / COMPOST</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{currentSite.organicKg || 0} KG</div>
                  </div>

                  <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 800 }}>GENERAL MIXED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155', marginTop: '2px' }}>{currentSite.mixedKg || 0} KG</div>
                  </div>
                </div>

                {/* Date-Wise Inflow History Table for this Site */}
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#047857', fontWeight: 800 }}>
                    Date-Wise Dump Inflow Records for {currentSite.organizationName}
                  </h3>

                  {siteInflowRecords.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                      No dump batches recorded for this site yet in the selected category.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                            <th style={{ padding: '10px 12px' }}>BIN ID</th>
                            <th style={{ padding: '10px 12px' }}>COLLECTOR DRIVER</th>
                            <th style={{ padding: '10px 12px' }}>CATEGORY</th>
                            <th style={{ padding: '10px 12px' }}>WEIGHT</th>
                            <th style={{ padding: '10px 12px' }}>STATUS</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {siteInflowRecords.map((r, i) => {
                            const stream = r.wasteType || r.separatedType || 'Organic/Compost';
                            return (
                              <tr key={r._id || r.id || i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#334155' }}>
                                  {r.dumpedAt ? new Date(r.dumpedAt).toLocaleString() : 'N/A'}
                                </td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{r.binId || 'BIN-01-01'}</td>
                                <td style={{ padding: '10px 12px' }}>{r.collectorName}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    background: stream.toLowerCase().includes('plastic') ? '#DBEAFE' : stream.toLowerCase().includes('metal') ? '#FEF3C7' : '#DCFCE7',
                                    color: stream.toLowerCase().includes('plastic') ? '#1E40AF' : stream.toLowerCase().includes('metal') ? '#92400E' : '#166534'
                                  }}>
                                    {stream}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#047857', fontSize: '13px' }}>
                                  {r.weightKg} KG
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    background: r.status === 'DELIVERED' ? '#DCFCE7' : r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT' ? '#FEF3C7' : '#F1F5F9',
                                    color: r.status === 'DELIVERED' ? '#166534' : r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT' ? '#92400E' : '#334155'
                                  }}>
                                    {r.status}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <button
                                    onClick={(e) => handleDeleteRecord(e, r._id || r.id)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      border: '1px solid #FCA5A5',
                                      background: '#FFF1F2',
                                      color: '#BE123C',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                    title="Delete this batch record"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TRANSPORTER DISPATCH & STREAM HAUL ASSIGNMENT                      */}
        {/* ========================================================================= */}
        {activeTab === 'DISPATCH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: Ready Batches Selection Table */}
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#047857', fontWeight: 800 }}>
                    Undispatched Waste Batches at Central Yard ({readyRecords.length})
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Select batches below to dispatch to a dedicated recycling plant via Transporter.
                  </div>
                </div>

                <button
                  onClick={selectAllReady}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {selectedRecordIds.length === readyRecords.length && readyRecords.length > 0 ? 'Deselect All' : 'Select All Ready'}
                </button>
              </div>

              {readyRecords.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                  No undispatched waste batches available in the yard for this category.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 10px', width: '36px' }}></th>
                        <th style={{ padding: '8px 10px' }}>ORIGIN CLIENT</th>
                        <th style={{ padding: '8px 10px' }}>BIN ID</th>
                        <th style={{ padding: '8px 10px' }}>STREAM</th>
                        <th style={{ padding: '8px 10px' }}>WEIGHT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readyRecords.map((r) => {
                        const isSelected = selectedRecordIds.includes(r._id || r.id);
                        const stream = r.wasteType || r.separatedType || 'Organic/Compost';
                        return (
                          <tr
                            key={r._id || r.id}
                            onClick={() => toggleSelectRecord(r._id || r.id)}
                            style={{
                              borderBottom: '1px solid #E2E8F0',
                              background: isSelected ? '#ECFDF5' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: 800, color: '#047857' }}>{r.organizationName}</div>
                              <div style={{ fontSize: '10px', color: '#64748B' }}>{r.address ? `${r.address}, ` : ''}{r.town}</div>
                            </td>
                            <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{r.binId || 'BIN-01-01'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: stream.toLowerCase().includes('plastic') ? '#DBEAFE' : stream.toLowerCase().includes('metal') ? '#FEF3C7' : '#DCFCE7',
                                color: stream.toLowerCase().includes('plastic') ? '#1E40AF' : stream.toLowerCase().includes('metal') ? '#92400E' : '#166534'
                              }}>
                                {stream}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#047857', fontSize: '13px' }}>
                              {r.weightKg} KG
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Transporter Assignment & Route Selection Form */}
            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#047857', fontWeight: 800 }}>
                Dispatch Transporter to Plant
              </h3>

              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                Selected Cargo: <strong>{selectedRecordIds.length} batch(es)</strong> (
                {records.filter(r => selectedRecordIds.includes(r._id || r.id)).reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(1)} KG)
              </div>

              <form onSubmit={handleDispatch}>
                {/* 1. Transporter Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    1. Select Transporter Driver:
                  </label>
                  <select
                    value={selectedTransporterId}
                    onChange={(e) => setSelectedTransporterId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  >
                    <option value="">-- Choose Active Transporter --</option>
                    {transporters.map(t => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.fullName} ({t.vehicleNumber || 'ICT-TRN-1001'}) - {t.workerStatus || 'IDLE'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Destination Recycling Plant Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    2. Destination Recycling Plant & Map Route:
                  </label>
                  
                  {/* Category Fast Switch */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleAutoSelectPlant('plastic')}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1E40AF', cursor: 'pointer', fontWeight: 800 }}
                    >
                      Plastic Plant
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoSelectPlant('metal')}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #FDE68A', background: '#FEF3C7', color: '#92400E', cursor: 'pointer', fontWeight: 800 }}
                    >
                      Metal Plant
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoSelectPlant('organic')}
                      style={{ flex: 1, padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#065F46', cursor: 'pointer', fontWeight: 800 }}
                    >
                      Organic Plant
                    </button>
                  </div>

                  <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  >
                    {plants.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.organizationName || p.fullName} ({p.plantType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Route destination details */}
                {currentSelectedPlant && (
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 800, color: '#047857' }}>{currentSelectedPlant.organizationName || currentSelectedPlant.fullName}</div>
                    <div style={{ color: '#64748B', marginTop: '2px' }}>{currentSelectedPlant.address}</div>
                    <div style={{ color: '#1E40AF', marginTop: '2px', fontWeight: 800 }}>
                      GPS Coordinates: [{plantCoords[0].toFixed(4)}, {plantCoords[1].toFixed(4)}]
                    </div>
                  </div>
                )}

                {/* Dispatch Notes */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Haul Instructions:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared bulk batch from PAF Complex"
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={dispatching || selectedRecordIds.length === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedRecordIds.length === 0 ? '#94A3B8' : '#047857',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: selectedRecordIds.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {dispatching ? 'Assigning Haul...' : 'Dispatch Transporter with Route Map'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INTERACTIVE LEAFLET ROUTE GUIDE MAP                                */}
        {/* ========================================================================= */}
        {activeTab === 'LOGISTICS_MAP' && (
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#047857', fontWeight: 800 }}>
                  Interactive Inter-Facility Transport Route Guide
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Visual routing from Central Dump Facility (Sector I-9/1) to registered industrial recycling plants.
                </div>
              </div>

              {/* Plant Selector for Map */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800 }}>Select Plant Destination:</span>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 800 }}
                >
                  {plants.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.organizationName || p.fullName} ({p.plantType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leaflet Map */}
            <div style={{ height: '440px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '16px' }}>
              <MapContainer
                center={DUMP_FACILITY_COORDS}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Central Dump Origin Marker */}
                <Marker position={DUMP_FACILITY_COORDS} icon={yardIcon}>
                  <Popup>
                    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px' }}>
                      <strong>Central Waste Dumping & Separation Hub</strong><br />
                      Sector I-9/1 Industrial Area, Islamabad<br />
                      <em>(Transit Origin Point)</em>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Recycling Plant Marker */}
                {currentSelectedPlant && (
                  <Marker position={plantCoords} icon={plantIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px' }}>
                        <strong>{currentSelectedPlant.organizationName || currentSelectedPlant.fullName}</strong><br />
                        Type: {currentSelectedPlant.plantType}<br />
                        {currentSelectedPlant.address}<br />
                        <em>(Destination Facility)</em>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Polyline Route Guidance */}
                {currentSelectedPlant && (
                  <Polyline
                    positions={[DUMP_FACILITY_COORDS, plantCoords]}
                    color="#047857"
                    weight={4}
                    dashArray="6, 8"
                  />
                )}
              </MapContainer>
            </div>

            {/* 3 Recycling Plants Summary Table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {plants.map((p, idx) => {
                const isCurrent = String(p._id || p.id) === String(selectedPlantId);
                const coords = p.coords || (p.plantType === 'Plastic' ? [33.5684, 73.1610] : p.plantType === 'Metal' ? [33.6512, 73.0321] : [33.6628, 73.0489]);
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPlantId(p._id || p.id)}
                    style={{
                      background: isCurrent ? '#ECFDF5' : '#F8FAFC',
                      padding: '14px',
                      borderRadius: '8px',
                      border: isCurrent ? '2px solid #047857' : '1px solid #E2E8F0',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#047857' }}>
                      {p.organizationName || p.fullName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      Stream: <strong>{p.plantType}</strong> | Capacity: {p.plantCapacityTons || 60} Tons
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {p.address}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1E40AF', marginTop: '4px', fontWeight: 800 }}>
                      GPS: [{coords[0].toFixed(4)}, {coords[1].toFixed(4)}]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MASTER INVENTORY LOG                                               */}
        {/* ========================================================================= */}
        {activeTab === 'INVENTORY' && (
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#047857', fontWeight: 800 }}>
                Master Dump Inflow Record Log ({records.length} Batches)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                    <th style={{ padding: '10px 12px' }}>ORIGIN CLIENT</th>
                    <th style={{ padding: '10px 12px' }}>BIN ID</th>
                    <th style={{ padding: '10px 12px' }}>COLLECTOR DRIVER</th>
                    <th style={{ padding: '10px 12px' }}>CATEGORY</th>
                    <th style={{ padding: '10px 12px' }}>WEIGHT</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r._id || r.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {r.dumpedAt ? new Date(r.dumpedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, color: '#047857' }}>{r.organizationName}</div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>{r.address ? `${r.address}, ` : ''}{r.town}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{r.binId}</td>
                      <td style={{ padding: '10px 12px' }}>{r.collectorName}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.wasteType}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#047857' }}>{r.weightKg} KG</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: r.status === 'DELIVERED' ? '#DCFCE7' : r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT' ? '#FEF3C7' : '#F1F5F9',
                          color: r.status === 'DELIVERED' ? '#166534' : r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT' ? '#92400E' : '#334155'
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => handleDeleteRecord(e, r._id || r.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #FCA5A5',
                            background: '#FFF1F2',
                            color: '#BE123C',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Delete this record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
