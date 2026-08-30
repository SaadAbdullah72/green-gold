import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

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

  // Selected Filter Area ('ALL' or specific area name)
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [activeTab, setActiveTab] = useState('AREAS'); // 'AREAS', 'INVENTORY', 'DISPATCH', 'HAULS'

  // Dispatch Form State
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Separation Form State
  const [separateStreamType, setSeparateStreamType] = useState('Plastic');
  const [separating, setSeparating] = useState(false);

  // Toast / Alert State
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

      if (analyticsRes.success) setAnalytics(analyticsRes);
      if (recordsRes.success) setRecords(recordsRes.records || []);
      if (trnRes.success) setTransporters(trnRes.transporters || []);
      if (plantRes.success) setPlants(plantRes.plants || []);
      if (jobsRes.success) setTransportJobs(jobsRes.jobs || []);
    } catch (err) {
      showMsg('error', 'Error loading dumping facility data: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Distinct Areas
  const availableAreas = useMemo(() => {
    if (!analytics?.areas) return [];
    return analytics.areas;
  }, [analytics]);

  // Selected Area Data
  const currentAreaData = useMemo(() => {
    if (selectedArea === 'ALL') return null;
    return availableAreas.find(a => a.areaName === selectedArea || a.town === selectedArea) || null;
  }, [selectedArea, availableAreas]);

  // Filtered Records based on selected area
  const filteredRecords = useMemo(() => {
    if (selectedArea === 'ALL') return records;
    return records.filter(r => {
      const matchTown = (r.town || '').toLowerCase() === selectedArea.toLowerCase();
      const matchOrg = (r.organizationName || '').toLowerCase().includes(selectedArea.toLowerCase());
      const matchAddr = (r.address || '').toLowerCase().includes(selectedArea.toLowerCase());
      return matchTown || matchOrg || matchAddr;
    });
  }, [records, selectedArea]);

  // Undispatched Records available for transport
  const readyForTransportRecords = useMemo(() => {
    return records.filter(r => r.status === 'DUMPED' || r.status === 'SEPARATED');
  }, [records]);

  // Handle Record Selection Toggle
  const toggleSelectRecord = (id) => {
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllReady = () => {
    if (selectedRecordIds.length === readyForTransportRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(readyForTransportRecords.map(r => r._id || r.id));
    }
  };

  // Auto-match Recycling Plant based on chosen waste stream
  const handleAutoSelectPlantByStream = (streamType) => {
    if (!plants || plants.length === 0) return;
    const norm = streamType.toLowerCase();
    let matched = null;
    if (norm.includes('plastic')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('plastic') || (p.organizationName || '').toLowerCase().includes('plastic'));
    } else if (norm.includes('metal')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('metal') || (p.organizationName || '').toLowerCase().includes('metal'));
    } else if (norm.includes('organic') || norm.includes('compost')) {
      matched = plants.find(p => (p.plantType || '').toLowerCase().includes('organic') || (p.organizationName || '').toLowerCase().includes('organic') || (p.organizationName || '').toLowerCase().includes('pak'));
    }
    if (matched) {
      setSelectedPlantId(matched._id || matched.id);
    }
  };

  // Perform Stream Separation
  const handleSeparate = async (e) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      showMsg('error', 'Please select at least one dump record batch to separate.');
      return;
    }
    try {
      setSeparating(true);
      const res = await api.dumpFacility.separateRecords({
        dumpRecordIds: selectedRecordIds,
        separatedType: separateStreamType,
        notes: `Separated into ${separateStreamType} at Central Dump Facility`
      });
      showMsg('success', res.message || `Batches separated into ${separateStreamType} stream successfully!`);
      setSelectedRecordIds([]);
      loadData();
    } catch (err) {
      showMsg('error', err.message || 'Separation failed');
    } finally {
      setSeparating(false);
    }
  };

  // Perform Transporter Dispatch to Recycling Plant
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      showMsg('error', 'Please select at least one waste batch to dispatch.');
      return;
    }
    if (!selectedTransporterId) {
      showMsg('error', 'Please select an assigned Transporter Driver.');
      return;
    }
    if (!selectedPlantId) {
      showMsg('error', 'Please select a Destination Recycling Plant.');
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

      showMsg('success', res.message || 'Transport Haul dispatched successfully to Recycling Plant!');
      setSelectedRecordIds([]);
      setSelectedTransporterId('');
      setSelectedPlantId('');
      setDispatchNotes('');
      loadData();
    } catch (err) {
      showMsg('error', err.message || 'Dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', fontFamily: 'Times New Roman, serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>♻️</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#064E3B' }}>Loading Central Dumping & Waste Separation Hub...</div>
        </div>
      </div>
    );
  }

  const totals = analytics?.totals || {};

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Times New Roman, serif', color: '#0F172A', paddingBottom: '60px' }}>
      
      {/* TOP COMMAND HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)', color: '#FFFFFF', padding: '24px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🏭</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.02em', color: '#F0FDF4' }}>
                  Central Waste Dumping & Separation Facility
                </h1>
                <div style={{ fontSize: '13px', color: '#A7F3D0', marginTop: '4px' }}>
                  Sector I-9/1 Industrial Hub, Islamabad | Automated Inflow Aggregation & Recycling Plant Logistics
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 'bold', textTransform: 'uppercase' }}>Operator Active</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.fullName || 'Yard Supervisor'} (DUMP-101)</div>
            </div>

            <button
              onClick={loadData}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFF',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              {refreshing ? 'Syncing...' : '🔄 Refresh Data'}
            </button>

            <button
              onClick={() => { logout(); if (onLogout) onLogout(); }}
              style={{
                background: '#DC2626',
                border: 'none',
                color: '#FFF',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {message.text && (
        <div style={{
          maxWidth: '1400px',
          margin: '16px auto 0',
          padding: '12px 24px',
          borderRadius: '8px',
          background: message.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: message.type === 'error' ? '#991B1B' : '#166534',
          border: `1px solid ${message.type === 'error' ? '#F87171' : '#86EFAC'}`,
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* MAIN BODY */}
      <main style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 20px' }}>

        {/* 1. GLOBAL HIGH-LEVEL KPI METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #059669' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>TOTAL DUMPED INFLOW</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#064E3B', marginTop: '6px' }}>
              {(totals.totalDumpedKg || 0).toLocaleString()} <span style={{ fontSize: '16px' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>From {totals.totalBatches || records.length} Collector Deliveries</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #3B82F6' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>🧴 PLASTIC WASTE STREAM</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '6px' }}>
              {(totals.totalPlasticKg || 0).toLocaleString()} <span style={{ fontSize: '16px' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '4px' }}>Destined for EcoPak Plastics Facility</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #F59E0B' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>🔩 METAL WASTE STREAM</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#B45309', marginTop: '6px' }}>
              {(totals.totalMetalKg || 0).toLocaleString()} <span style={{ fontSize: '16px' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>Destined for GreenTech Materials Facility</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #10B981' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>🍂 ORGANIC / COMPOST</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#047857', marginTop: '6px' }}>
              {(totals.totalOrganicKg || 0).toLocaleString()} <span style={{ fontSize: '16px' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Destined for Pak Recycling Ltd</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '5px solid #8B5CF6' }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>🚚 ACTIVE HAULS EN ROUTE</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6D28D9', marginTop: '6px' }}>
              {transportJobs.filter(j => j.status === 'ASSIGNED' || j.status === 'IN_TRANSIT').length} <span style={{ fontSize: '16px' }}>Jobs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px' }}>{(totals.inTransitKg || 0).toLocaleString()} kg In Transit</div>
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #CBD5E1', paddingBottom: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('AREAS')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'AREAS' ? '#064E3B' : '#E2E8F0',
              color: activeTab === 'AREAS' ? '#FFF' : '#334155',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📍 Area-Wise Separation Breakdown ({availableAreas.length} Active Sites)
          </button>

          <button
            onClick={() => setActiveTab('DISPATCH')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'DISPATCH' ? '#064E3B' : '#E2E8F0',
              color: activeTab === 'DISPATCH' ? '#FFF' : '#334155',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🚚 Transporter Dispatch & Plant Assignment ({readyForTransportRecords.length} Ready)
          </button>

          <button
            onClick={() => setActiveTab('INVENTORY')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'INVENTORY' ? '#064E3B' : '#E2E8F0',
              color: activeTab === 'INVENTORY' ? '#FFF' : '#334155',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            📦 Master Dump Inventory Log ({records.length} Batches)
          </button>

          <button
            onClick={() => setActiveTab('HAULS')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'HAULS' ? '#064E3B' : '#E2E8F0',
              color: activeTab === 'HAULS' ? '#FFF' : '#334155',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🛣️ Dispatched Logistics Hauls Monitor ({transportJobs.length})
          </button>
        </div>

        {/* TAB 1: AREA-WISE BREAKDOWN */}
        {activeTab === 'AREAS' && (
          <div>
            {/* Area Filter Selector Pills */}
            <div style={{ background: '#FFFFFF', padding: '18px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '12px' }}>
                SELECT ACTIVE CLIENT AREA TO VIEW SEPARATED TOTALS & INFLOW TIMELINE:
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedArea('ALL')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedArea === 'ALL' ? '2px solid #064E3B' : '1px solid #CBD5E1',
                    background: selectedArea === 'ALL' ? '#ECFDF5' : '#F8FAFC',
                    color: selectedArea === 'ALL' ? '#064E3B' : '#334155',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🌐 All Service Areas Combined ({records.length} records)
                </button>

                {availableAreas.map((area, idx) => {
                  const isSelected = selectedArea === area.areaName || selectedArea === area.town;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedArea(area.areaName || area.town)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid #064E3B' : '1px solid #CBD5E1',
                        background: isSelected ? '#ECFDF5' : '#F8FAFC',
                        color: isSelected ? '#064E3B' : '#334155',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      📍 {area.organizationName || area.areaName} ({area.totalKg} kg)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Area Stream Breakdown Card */}
            {currentAreaData ? (
              <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px', borderTop: '4px solid #064E3B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#064E3B', fontWeight: 'bold' }}>
                      📍 {currentAreaData.organizationName || currentAreaData.areaName}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      Location: {currentAreaData.address ? `${currentAreaData.address}, ` : ''}{currentAreaData.town || currentAreaData.city} | Active Bins Deployed
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>AREA GRAND TOTAL</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#064E3B' }}>{currentAreaData.totalKg} kg</div>
                  </div>
                </div>

                {/* 4 Stream Cards for this specific area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 'bold' }}>🧴 PLASTIC TOTAL</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1D4ED8', marginTop: '4px' }}>
                      {currentAreaData.plasticKg} <span style={{ fontSize: '14px' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#3B82F6', marginTop: '2px' }}>Dispatches to EcoPak Plastics</div>
                  </div>

                  <div style={{ background: '#FEF3C7', padding: '16px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 'bold' }}>🔩 METAL TOTAL</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#B45309', marginTop: '4px' }}>
                      {currentAreaData.metalKg} <span style={{ fontSize: '14px' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>Dispatches to GreenTech Metal</div>
                  </div>

                  <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 'bold' }}>🍂 ORGANIC / COMPOST</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#047857', marginTop: '4px' }}>
                      {currentAreaData.organicKg} <span style={{ fontSize: '14px' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Dispatches to Pak Recycling Ltd</div>
                  </div>

                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>📦 GENERAL / MIXED</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155', marginTop: '4px' }}>
                      {currentAreaData.mixedKg} <span style={{ fontSize: '14px' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Requires Yard Sorting</div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Date-Wise Inflow History Table */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#064E3B', fontWeight: 'bold' }}>
                  📅 Date-Wise Inflow Log {selectedArea !== 'ALL' ? `for ${selectedArea}` : '(All Locations)'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Showing {filteredRecords.length} collection dumps</span>
              </div>

              {filteredRecords.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                  No dump records recorded for this area yet. As Waste Collectors complete their pickups, waste will be dumped here automatically.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '12px 14px' }}>DATE / TIME</th>
                        <th style={{ padding: '12px 14px' }}>SOURCE FACILITY</th>
                        <th style={{ padding: '12px 14px' }}>BIN ID</th>
                        <th style={{ padding: '12px 14px' }}>COLLECTOR DRIVER</th>
                        <th style={{ padding: '12px 14px' }}>WASTE STREAM</th>
                        <th style={{ padding: '12px 14px' }}>WEIGHT</th>
                        <th style={{ padding: '12px 14px' }}>CURRENT STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((rec, i) => {
                        const dateStr = rec.dumpedAt ? new Date(rec.dumpedAt).toLocaleString() : 'N/A';
                        const stream = rec.wasteType || rec.separatedType || 'Organic/Compost';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#334155' }}>{dateStr}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 'bold', color: '#064E3B' }}>{rec.organizationName}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.address}, {rec.town}</div>
                            </td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 'bold' }}>{rec.binId || 'BIN-01-01'}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div>{rec.collectorName}</div>
                              {rec.collectorPhone && <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.collectorPhone}</div>}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                background: stream.toLowerCase().includes('plastic') ? '#DBEAFE' : stream.toLowerCase().includes('metal') ? '#FEF3C7' : '#DCFCE7',
                                color: stream.toLowerCase().includes('plastic') ? '#1E40AF' : stream.toLowerCase().includes('metal') ? '#92400E' : '#166534'
                              }}>
                                {stream}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', fontSize: '14px', color: '#064E3B' }}>
                              {rec.weightKg} kg
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                background: rec.status === 'DELIVERED' || rec.status === 'PROCESSED' ? '#DCFCE7' : rec.status === 'ASSIGNED_TRANSPORT' || rec.status === 'IN_TRANSIT' ? '#FEF3C7' : '#E2E8F0',
                                color: rec.status === 'DELIVERED' || rec.status === 'PROCESSED' ? '#166534' : rec.status === 'ASSIGNED_TRANSPORT' || rec.status === 'IN_TRANSIT' ? '#92400E' : '#334155'
                              }}>
                                {rec.status}
                              </span>
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

        {/* TAB 2: TRANSPORTER DISPATCH & STREAM SEPARATION */}
        {activeTab === 'DISPATCH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
            
            {/* Left: Ready Records Table with Selection Checkboxes */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#064E3B', fontWeight: 'bold' }}>
                    📦 Undispatched Waste Batches at Yard ({readyForTransportRecords.length})
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Select batches below to separate into dedicated streams or assign a Transporter to haul directly to a Recycling Plant.
                  </div>
                </div>

                <button
                  onClick={selectAllReady}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {selectedRecordIds.length === readyForTransportRecords.length && readyForTransportRecords.length > 0 ? 'Deselect All' : 'Select All Ready'}
                </button>
              </div>

              {readyForTransportRecords.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                  No undispatched waste at the yard currently. All collected batches have been dispatched to recycling plants.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px', width: '40px' }}></th>
                        <th style={{ padding: '10px 12px' }}>SOURCE & DATE</th>
                        <th style={{ padding: '10px 12px' }}>STREAM</th>
                        <th style={{ padding: '10px 12px' }}>WEIGHT</th>
                        <th style={{ padding: '10px 12px' }}>SEPARATED?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readyForTransportRecords.map((rec) => {
                        const isSelected = selectedRecordIds.includes(rec._id || rec.id);
                        const stream = rec.wasteType || rec.separatedType || 'Organic/Compost';
                        return (
                          <tr
                            key={rec._id || rec.id}
                            onClick={() => toggleSelectRecord(rec._id || rec.id)}
                            style={{
                              borderBottom: '1px solid #E2E8F0',
                              background: isSelected ? '#ECFDF5' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 'bold', color: '#064E3B' }}>{rec.organizationName}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>
                                {rec.dumpedAt ? new Date(rec.dumpedAt).toLocaleDateString() : ''} | {rec.town}
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                background: stream.toLowerCase().includes('plastic') ? '#DBEAFE' : stream.toLowerCase().includes('metal') ? '#FEF3C7' : '#DCFCE7',
                                color: stream.toLowerCase().includes('plastic') ? '#1E40AF' : stream.toLowerCase().includes('metal') ? '#92400E' : '#166534'
                              }}>
                                {stream}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#064E3B' }}>
                              {rec.weightKg} kg
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {rec.isSeparated ? (
                                <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '11px' }}>✅ {rec.separatedType}</span>
                              ) : (
                                <span style={{ color: '#D97706', fontSize: '11px' }}>Pending Separation</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Side: Actions Panel (Separation + Transporter Dispatch) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Box 1: Dispatch to Transporter & Recycling Plant */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #059669' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#064E3B', fontWeight: 'bold' }}>
                  🚚 Dispatch Transporter to Plant
                </h4>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                  Selected: <strong>{selectedRecordIds.length} batch(es)</strong> (
                  {records.filter(r => selectedRecordIds.includes(r._id || r.id)).reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(1)} kg)
                </div>

                <form onSubmit={handleDispatch}>
                  {/* Select Transporter */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      1. Assign Transporter Driver:
                    </label>
                    <select
                      value={selectedTransporterId}
                      onChange={(e) => setSelectedTransporterId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    >
                      <option value="">-- Choose Transporter --</option>
                      {transporters.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.fullName} ({t.vehicleNumber || 'ICT-TRN'}) - {t.workerStatus || 'IDLE'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Stream Match buttons */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      2. Destination Recycling Facility:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleAutoSelectPlantByStream('plastic')}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1E40AF', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🧴 Plastic Plant
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoSelectPlantByStream('metal')}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #FDE68A', background: '#FEF3C7', color: '#92400E', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🔩 Metal Plant
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoSelectPlantByStream('organic')}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#065F46', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🍂 Organic Plant
                      </button>
                    </div>

                    <select
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    >
                      <option value="">-- Choose Recycling Plant --</option>
                      {plants.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.organizationName || p.fullName} ({p.plantType || 'Multi-Stream'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Dispatched Logistics Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cleared batch from Sector E-9"
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
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
                      background: selectedRecordIds.length === 0 ? '#94A3B8' : '#064E3B',
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: selectedRecordIds.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {dispatching ? 'Dispatching Transport Haul...' : '🚀 Dispatch Transporter to Plant'}
                  </button>
                </form>
              </div>

              {/* Box 2: Yard Stream Separation */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #3B82F6' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#1E40AF', fontWeight: 'bold' }}>
                  ⚙️ Separate Waste Stream at Yard
                </h4>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                  Re-classify unseparated mixed dump into dedicated single streams before dispatching:
                </div>

                <form onSubmit={handleSeparate}>
                  <div style={{ marginBottom: '12px' }}>
                    <select
                      value={separateStreamType}
                      onChange={(e) => setSeparateStreamType(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    >
                      <option value="Plastic">🧴 Plastic Waste (Polymers / Bottles)</option>
                      <option value="Metal">🔩 Metal Waste (Aluminum / Steel Scrap)</option>
                      <option value="Organic/Compost">🍂 Organic / Compost (Bio Waste)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={separating || selectedRecordIds.length === 0}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedRecordIds.length === 0 ? '#94A3B8' : '#1D4ED8',
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: selectedRecordIds.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {separating ? 'Separating...' : `Mark Selected as ${separateStreamType}`}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: MASTER INVENTORY */}
        {activeTab === 'INVENTORY' && (
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#064E3B', fontWeight: 'bold' }}>
                📦 All Incoming Dump Inflow Records ({records.length} Batches)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 14px' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 14px' }}>ORIGIN / CLIENT</th>
                    <th style={{ padding: '12px 14px' }}>BIN ID</th>
                    <th style={{ padding: '12px 14px' }}>DELIVERED BY</th>
                    <th style={{ padding: '12px 14px' }}>STREAM</th>
                    <th style={{ padding: '12px 14px' }}>WEIGHT</th>
                    <th style={{ padding: '12px 14px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {rec.dumpedAt ? new Date(rec.dumpedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 'bold', color: '#064E3B' }}>{rec.organizationName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.address}, {rec.town}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{rec.binId}</td>
                      <td style={{ padding: '12px 14px' }}>{rec.collectorName}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>{rec.wasteType}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#064E3B' }}>{rec.weightKg} kg</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: rec.status === 'DELIVERED' ? '#DCFCE7' : '#FEF3C7',
                          color: rec.status === 'DELIVERED' ? '#166534' : '#92400E'
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DISPATCHED HAULS MONITOR */}
        {activeTab === 'HAULS' && (
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#064E3B', fontWeight: 'bold' }}>
                🛣️ Dispatched Logistics Transport Hauls from Yard to Recycling Plants ({transportJobs.length})
              </h3>
            </div>

            {transportJobs.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px' }}>
                No transport hauls have been dispatched from the yard yet. Use the "Transporter Dispatch" tab to assign a haul.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '12px 14px' }}>JOB CODE</th>
                      <th style={{ padding: '12px 14px' }}>TRANSPORTER</th>
                      <th style={{ padding: '12px 14px' }}>DESTINATION PLANT</th>
                      <th style={{ padding: '12px 14px' }}>STREAM</th>
                      <th style={{ padding: '12px 14px' }}>WEIGHT</th>
                      <th style={{ padding: '12px 14px' }}>DISPATCHED DATE</th>
                      <th style={{ padding: '12px 14px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportJobs.map((job, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#064E3B' }}>
                          {job.jobCode}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 'bold' }}>{job.transporterName}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{job.vehicleNumber}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1D4ED8' }}>{job.plantName}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{job.plantAddress}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>{job.wasteType}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 'bold', fontSize: '14px', color: '#064E3B' }}>
                          {job.totalWeightKg} kg
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {job.assignedAt ? new Date(job.assignedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: job.status === 'DELIVERED' ? '#DCFCE7' : job.status === 'IN_TRANSIT' ? '#FEF3C7' : '#DBEAFE',
                            color: job.status === 'DELIVERED' ? '#166534' : job.status === 'IN_TRANSIT' ? '#92400E' : '#1E40AF'
                          }}>
                            {job.status === 'DELIVERED' ? '✅ DELIVERED AT PLANT' : job.status === 'IN_TRANSIT' ? '🚚 IN TRANSIT' : '⏳ ASSIGNED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
