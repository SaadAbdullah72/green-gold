import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconBrandLogo, IconBox, IconUser } from './Icons';
import DashboardAssistant from './DashboardAssistant';

const depotIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(245,158,11,0.25);"></div><div style="width:14px;height:14px;border-radius:50%;background:#D97706;border:2px solid #FFFFFF;box-shadow:0 3px 8px rgba(0,0,0,0.3);position:relative;z-index:2;"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const plantIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(4,120,87,0.25);"></div><div style="width:16px;height:16px;border-radius:50%;background:#047857;border:3px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.35);position:relative;z-index:2;"></div></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function TransporterDashboard({ onLogout }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned_dispatches');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadJobs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.transporter.getMyJobs();
      if (res.jobs) {
        setJobs(res.jobs);
        if (!selectedJob && res.jobs.length > 0) {
          setSelectedJob(res.jobs[0]);
        }
      }
    } catch (err) {
      console.error('Error loading transport jobs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(() => loadJobs(true), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (jobId) => {
    try {
      setActionLoadingId(jobId);
      const res = await api.transporter.acceptJob(jobId);
      setStatusMessage(res.message || 'Transport job accepted!');
      setTimeout(() => setStatusMessage(''), 3000);
      await loadJobs(true);
    } catch (err) {
      alert(`Accept Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartTransit = async (jobId) => {
    try {
      setActionLoadingId(jobId);
      const res = await api.transporter.startTransit(jobId);
      setStatusMessage(res.message || 'Transit commenced. En route to recycling plant.');
      setTimeout(() => setStatusMessage(''), 3000);
      await loadJobs(true);
    } catch (err) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkDelivered = async (jobId) => {
    try {
      setActionLoadingId(jobId);
      const res = await api.transporter.markDelivered(jobId);
      setStatusMessage(res.message || 'Delivery verified at plant reception gate.');
      setTimeout(() => setStatusMessage(''), 3000);
      await loadJobs(true);
    } catch (err) {
      alert(`Delivery Confirmation Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeDispatches = jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'DELIVERED');
  const completedDispatches = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED');

  const currentJob = (selectedJob ? jobs.find(j => String(j.id || j._id) === String(selectedJob.id || selectedJob._id)) : null)
    || (jobs.length > 0 ? jobs[0] : null);

  const DUMP_YARD_COORDS = currentJob?.originCoords && currentJob.originCoords.length === 2 
    ? currentJob.originCoords 
    : [33.6660, 73.0410];

  const wt = (currentJob?.wasteType || '').toLowerCase();
  const PLANT_COORDS = currentJob?.destinationCoords && currentJob.destinationCoords.length === 2 
    ? currentJob.destinationCoords 
    : (wt.includes('plastic') 
        ? [33.5684, 73.1610] 
        : wt.includes('metal') 
          ? [33.6512, 73.0321] 
          : [33.6628, 73.0489]);

  const mapCenter = [
    (DUMP_YARD_COORDS[0] + PLANT_COORDS[0]) / 2,
    (DUMP_YARD_COORDS[1] + PLANT_COORDS[1]) / 2
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF6', fontFamily: 'Times New Roman, serif', color: '#0F172A' }}>
      
      {/* Top Professional Header */}
      <header style={{
        background: '#047857',
        color: '#FFFFFF',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(4,120,87,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <IconBrandLogo />
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>
              LOGISTICS & INTER-FACILITY TRANSIT FLEET
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              GreenGold OS — Transporter Operations Console
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div style={{ fontWeight: 800 }}>{user?.fullName || 'Transporter Driver'}</div>
            <div style={{ opacity: 0.85 }}>Vehicle: <strong>{user?.vehicleNumber || 'ICT-TRN-1001'}</strong> ({user?.employeeId || 'TRN-101'})</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)',
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

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
        
        {/* Status Notification Banner */}
        {statusMessage && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 20px',
            background: '#ECFDF5',
            border: '1px solid #10B981',
            borderRadius: '12px',
            color: '#065F46',
            fontWeight: 800,
            fontSize: '14px'
          }}>
            ✓ {statusMessage}
          </div>
        )}

        {/* Fleet KPI Metric Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Assignments</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{activeDispatches.length}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Pending or in transit dispatches</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Weight Onboard</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
              {activeDispatches.reduce((acc, j) => acc + (j.totalWeightKg || 0), 0).toFixed(1)} <span style={{ fontSize: '14px' }}>KG</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Separated waste payloads</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Delivered Manifests</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', marginTop: '4px' }}>{completedDispatches.length}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Successfully handed to plant gates</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Assigned Vehicle</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{user?.vehicleNumber || 'ICT-TRN-1001'}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Certified heavy hauler</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('assigned_dispatches')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'assigned_dispatches' ? '#047857' : '#64748B',
              borderBottom: activeTab === 'assigned_dispatches' ? '3px solid #047857' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Active Transport Dispatches ({activeDispatches.length})
          </button>

          <button
            onClick={() => setActiveTab('manifest_history')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'manifest_history' ? '#047857' : '#64748B',
              borderBottom: activeTab === 'manifest_history' ? '3px solid #047857' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Completed Delivery History ({completedDispatches.length})
          </button>
        </div>

        {/* Tab 1: Active Dispatches */}
        {activeTab === 'assigned_dispatches' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            
            {/* Left: Dispatch Cards */}
            <div>
              {activeDispatches.length === 0 ? (
                <div style={{ background: '#FFFFFF', padding: '40px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>No Pending Dispatches Assigned</div>
                  <div style={{ fontSize: '12px' }}>When operations management classifies separated waste at the dump site and assigns your vehicle, it will appear here in real-time.</div>
                </div>
              ) : (
                activeDispatches.map((job) => {
                  const isSelected = currentJob && String(currentJob.id || currentJob._id) === String(job.id || job._id);
                  const isBusy = actionLoadingId === (job.id || job._id);

                  return (
                    <div
                      key={job.id || job._id}
                      onClick={() => setSelectedJob(job)}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        border: isSelected ? '2px solid #047857' : '1px solid #E2E8F0',
                        boxShadow: isSelected ? '0 8px 24px rgba(4,120,87,0.15)' : '0 2px 8px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#ECFDF5',
                            color: '#047857',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            marginBottom: '6px'
                          }}>
                            {job.jobCode}
                          </span>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                            Destination: {job.plantName}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            {job.plantAddress}
                          </div>
                        </div>

                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: job.status === 'IN_TRANSIT' ? '#FEF3C7' : '#E0F2FE',
                          color: job.status === 'IN_TRANSIT' ? '#92400E' : '#0369A1'
                        }}>
                          {job.status}
                        </span>
                      </div>

                      {/* Cargo Payload Summary */}
                      <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Waste Category</span>
                          <strong style={{ color: '#047857' }}>{job.wasteType}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Total Payload</span>
                          <strong style={{ color: '#0F172A' }}>{job.totalWeightKg} KG</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Dump Batches</span>
                          <strong style={{ color: '#0F172A' }}>{job.dumpRecordCount} Lots</strong>
                        </div>
                      </div>

                      {/* Action Dispatch Buttons */}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        {job.status === 'ASSIGNED' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => { e.stopPropagation(); handleAccept(job.id || job._id); }}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              background: '#047857',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: isBusy ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isBusy ? 'Processing...' : 'Accept Dispatch Duty'}
                          </button>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => { e.stopPropagation(); handleStartTransit(job.id || job._id); }}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              background: '#D97706',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: isBusy ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isBusy ? 'Processing...' : 'Start Transit (En Route)'}
                          </button>
                        )}

                        {job.status === 'IN_TRANSIT' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => { e.stopPropagation(); handleMarkDelivered(job.id || job._id); }}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              background: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: isBusy ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isBusy ? 'Processing...' : 'Confirm Delivery at Plant Gate'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Interactive Route Map & Batch Manifest Inspection */}
            <div style={{ position: 'sticky', top: '24px' }}>
              {currentJob ? (
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                        LIVE TRANSIT ROUTE • {currentJob.jobCode}
                      </div>
                      <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                        {currentJob.originSite} ➔ {currentJob.plantName}
                      </h3>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: '#ECFDF5', color: '#065F46' }}>
                      Payload: {currentJob.totalWeightKg} KG
                    </span>
                  </div>

                  {/* Route Map */}
                  <div style={{ height: '280px', width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1px solid #CBD5E1', marginBottom: '18px' }}>
                    <MapContainer
                      key={currentJob.id || currentJob._id}
                      center={mapCenter}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={DUMP_YARD_COORDS} icon={depotIcon}>
                        <Popup>
                          <strong>Origin: Central Dump Facility</strong><br />
                          Sector I-9/1 Industrial Area, Islamabad
                        </Popup>
                      </Marker>
                      <Marker position={PLANT_COORDS} icon={plantIcon}>
                        <Popup>
                          <strong>Destination: {currentJob.plantName}</strong><br />
                          {currentJob.plantAddress}
                        </Popup>
                      </Marker>
                      <Polyline
                        positions={[DUMP_YARD_COORDS, PLANT_COORDS]}
                        color="#047857"
                        weight={4}
                        dashArray="6, 8"
                      />
                    </MapContainer>
                  </div>

                  {/* Dump Batches Contained inside this truckload */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Constituent Client Dump Batches ({currentJob.dumpRecords?.length || 0}):
                    </div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(currentJob.dumpRecords || []).map((rec, rIdx) => (
                        <div key={rIdx} style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <div>
                            <strong style={{ color: '#0F172A' }}>{rec.organizationName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.clientCode} • {rec.binId}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#047857' }}>{rec.weightKg} KG</strong>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>{rec.wasteType}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '40px 24px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                  Select a dispatch to inspect route telemetry
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Manifest History */}
        {activeTab === 'manifest_history' && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
              Delivered Transport Manifests Ledger
            </h3>

            {completedDispatches.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B' }}>
                No completed deliveries in your ledger yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Job Code</th>
                    <th style={{ padding: '12px' }}>Destination Plant</th>
                    <th style={{ padding: '12px' }}>Waste Stream</th>
                    <th style={{ padding: '12px' }}>Payload Weight</th>
                    <th style={{ padding: '12px' }}>Delivered Date</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedDispatches.map((j) => (
                    <tr key={j.id || j._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#047857' }}>{j.jobCode}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{j.plantName}</td>
                      <td style={{ padding: '12px' }}>{j.wasteType}</td>
                      <td style={{ padding: '12px', fontWeight: 800 }}>{j.totalWeightKg} KG</td>
                      <td style={{ padding: '12px', color: '#64748B' }}>
                        {j.deliveredAt ? new Date(j.deliveredAt).toLocaleString() : 'Delivered'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: '#D1FAE5', color: '#065F46' }}>
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>

      <DashboardAssistant dashboardName="transporter" accent="#047857" />
    </div>
  );
}
