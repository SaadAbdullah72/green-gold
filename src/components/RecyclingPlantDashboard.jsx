import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconBrandLogo } from './Icons';
import DashboardAssistant from './DashboardAssistant';
import GreenGoldLogo from './GreenGoldLogo';

const CC_FACTORS = {
  'Organic/Compost': 0.5,
  'Plastic': 1.2,
  'Metal': 2.0,
  'General Mixed': 0.3
};

export default function RecyclingPlantDashboard({ onLogout }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming_batches');
  const [deliveries, setDeliveries] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Processing Audit Modal State
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [receivedKg, setReceivedKg] = useState(0);
  const [recycledKg, setRecycledKg] = useState(0);
  const [rejectedKg, setRejectedKg] = useState(0);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [inspectorName, setInspectorName] = useState(user?.fullName || 'Chief Inspector');
  const [submittingAudit, setSubmittingAudit] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [delivRes, reportRes, statRes] = await Promise.all([
        api.recycling.getMyDeliveries(),
        api.recycling.getMyReports(),
        api.recycling.getStats()
      ]);

      if (delivRes.jobs) setDeliveries(delivRes.jobs);
      if (reportRes.reports) setReports(reportRes.reports);
      if (statRes.stats) setStats(statRes.stats);
    } catch (err) {
      console.error('Error loading recycling plant data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleOpenProcessModal = (job) => {
    setSelectedDelivery(job);
    const initialWeight = Number(job.totalWeightKg || 10);
    setReceivedKg(initialWeight);
    setRecycledKg(Number((initialWeight * 0.85).toFixed(1)));
    setRejectedKg(Number((initialWeight * 0.15).toFixed(1)));
    setOperatorNotes('');
    setInspectorName(user?.fullName || 'Chief Inspector');
    setShowProcessModal(true);
  };

  const handleReceivedChange = (val) => {
    const num = Number(val) || 0;
    setReceivedKg(num);
    const rec = Math.min(num, Number((num * 0.85).toFixed(1)));
    setRecycledKg(rec);
    setRejectedKg(Math.max(0, Number((num - rec).toFixed(1))));
  };

  const handleRecycledChange = (val) => {
    const num = Number(val) || 0;
    setRecycledKg(num);
    setRejectedKg(Math.max(0, Number((receivedKg - num).toFixed(1))));
  };

  const handleSubmitAudit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setSubmittingAudit(true);
      const res = await api.recycling.submitReport({
        transportJobId: selectedDelivery.id || selectedDelivery._id,
        receivedWeightKg: Number(receivedKg),
        recycledWeightKg: Number(recycledKg),
        rejectedWeightKg: Number(rejectedKg),
        notes: operatorNotes,
        operatorName: inspectorName
      });

      setStatusMessage(res.message || 'Recycling report submitted & carbon credits minted!');
      setShowProcessModal(false);
      setTimeout(() => setStatusMessage(''), 4000);
      await loadData(true);
    } catch (err) {
      alert(`Audit Submission Error: ${err.message}`);
    } finally {
      setSubmittingAudit(false);
    }
  };

  const handleDeleteReport = async (e, reportId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this plant recycling report?')) return;
    try {
      await api.recycling.deleteReport(reportId);
      setStatusMessage('Recycling report deleted successfully.');
      setTimeout(() => setStatusMessage(''), 3000);
      await loadData(true);
    } catch (err) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  const handleClearAllReports = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL recycling audit reports for this facility?')) return;
    try {
      await api.recycling.clearAllReports();
      setStatusMessage('All facility audit reports cleared.');
      setTimeout(() => setStatusMessage(''), 3000);
      await loadData(true);
    } catch (err) {
      alert(`Clear Error: ${err.message}`);
    }
  };

  const wasteStreamType = selectedDelivery?.wasteType || user?.plantType || 'Organic/Compost';
  const currentCcFactor = CC_FACTORS[wasteStreamType] || 0.5;
  const previewCarbonCredits = (recycledKg * currentCcFactor).toFixed(2);

  const pendingDeliveries = deliveries.filter(d => d.status === 'DELIVERED' || d.status === 'IN_TRANSIT');

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF8', color: '#0F172A' }}>
      
      {/* Top Header (Clean Modern Theme) */}
      <header style={{
        background: '#FFFFFF',
        color: '#0F172A',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <GreenGoldLogo size={44} textColor="#0F172A" subtextColor="#065F46" subtitle="Industrial Recycling & Resource Recovery Facility" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>{user?.fullName || 'Plant Chief Inspector'}</div>
            <div style={{ color: '#64748B', marginTop: '2px' }}>Stream: <strong style={{ color: '#064E3B' }}>{user?.plantType || 'Organic/Compost'}</strong> | Capacity: <strong>{user?.plantCapacityTons || 50} Tons/day</strong></div>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
        
        {/* Status Notification */}
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

        {/* Industrial KPI Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Incoming Batches</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>{pendingDeliveries.length}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Awaiting processing audit</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Processed Biomass</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
              {(stats?.totalRecycledKg || 0).toFixed(1)} <span style={{ fontSize: '14px' }}>KG</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Total material recovered</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Carbon Credits Minted</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
              {(stats?.totalCarbonCredits || 0).toFixed(2)} <span style={{ fontSize: '14px' }}>CC</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Credited to waste generators</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Recovery Efficiency</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B', marginTop: '4px' }}>
              {stats?.avgEfficiency || 85.0}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Average material yield</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('incoming_batches')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'incoming_batches' ? '#047857' : '#64748B',
              borderBottom: activeTab === 'incoming_batches' ? '3px solid #047857' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Delivered Cargo Awaiting Audit ({pendingDeliveries.length})
          </button>

          <button
            onClick={() => setActiveTab('certified_reports')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'certified_reports' ? '#047857' : '#64748B',
              borderBottom: activeTab === 'certified_reports' ? '3px solid #047857' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Certified Recycling Reports & Carbon Ledger ({reports.length})
          </button>
        </div>

        {/* Tab 1: Incoming Batches */}
        {activeTab === 'incoming_batches' && (
          <div>
            {pendingDeliveries.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '40px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>No Pending Cargo Deliveries</div>
                <div style={{ fontSize: '12px' }}>When transporters deliver separated waste shipments to your facility gate, they will appear here ready for material audit entry.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
                {pendingDeliveries.map((job) => (
                  <div
                    key={job.id || job._id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '22px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#ECFDF5',
                            color: '#047857',
                            fontSize: '11px',
                            fontWeight: 900,
                            marginBottom: '4px'
                          }}>
                            {job.jobCode}
                          </span>
                          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                            {job.wasteType} Waste Cargo
                          </h3>
                        </div>

                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: job.status === 'DELIVERED' ? '#D1FAE5' : '#FEF3C7',
                          color: job.status === 'DELIVERED' ? '#065F46' : '#92400E'
                        }}>
                          {job.status}
                        </span>
                      </div>

                      {/* Details Matrix */}
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', margin: '14px 0' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Carrier Transporter</span>
                          <strong style={{ color: '#0F172A' }}>{job.transporterName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{job.vehicleNumber}</div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Manifest Payload</span>
                          <strong style={{ color: '#047857', fontSize: '15px' }}>{job.totalWeightKg} KG</strong>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{job.dumpRecords?.length || 1} client lots</div>
                        </div>
                      </div>

                      {/* Origin client breakdown */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Origin Waste Generators:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(job.dumpRecords || []).map((dr, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: '#F1F5F9',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#1E293B'
                              }}
                            >
                              {dr.organizationName} ({dr.weightKg} kg)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenProcessModal(job)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#047857',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(4,120,87,0.2)'
                      }}
                    >
                      Audit & Record Recycled Yield ✍️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Certified Reports Ledger */}
        {activeTab === 'certified_reports' && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
              Certified Industrial Resource Recovery & Carbon Credits Ledger
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#047857' }}>
                Plant Processing Audit Logs ({reports.length})
              </h2>
              {reports.length > 0 && (
                <button
                  onClick={handleClearAllReports}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All Reports
                </button>
              )}
            </div>

            {reports.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B' }}>
                No completed recycling reports in your ledger yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Report Code</th>
                    <th style={{ padding: '12px' }}>Waste Stream</th>
                    <th style={{ padding: '12px' }}>Received (KG)</th>
                    <th style={{ padding: '12px' }}>Recycled (KG)</th>
                    <th style={{ padding: '12px' }}>Efficiency</th>
                    <th style={{ padding: '12px' }}>Carbon Credits</th>
                    <th style={{ padding: '12px' }}>Inspector</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id || r._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#047857' }}>{r.reportCode}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{r.wasteType}</td>
                      <td style={{ padding: '12px' }}>{r.receivedWeightKg} KG</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0F172A' }}>{r.recycledWeightKg} KG</td>
                      <td style={{ padding: '12px' }}>{r.recoveryEfficiencyPercent}%</td>
                      <td style={{ padding: '12px', fontWeight: 900, color: '#059669' }}>
                        +{r.carbonCreditsGenerated} CC
                      </td>
                      <td style={{ padding: '12px', color: '#64748B' }}>{r.operatorName}</td>
                      <td style={{ padding: '12px', color: '#64748B' }}>
                        {r.processedAt ? new Date(r.processedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => handleDeleteReport(e, r.id || r._id)}
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
                          title="Delete Record"
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
        )}

      </main>

      {/* Manual Processing & Carbon Minting Modal */}
      {showProcessModal && selectedDelivery && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                  CERTIFIED RECOVERY AUDIT ENTRY
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>
                  {selectedDelivery.jobCode} • {selectedDelivery.wasteType}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAudit}>
              
              {/* Manifest Received Weight */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Verified Received Gross Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={receivedKg}
                  onChange={(e) => handleReceivedChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Net Recycled Weight (Entered Manually by Factory) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Actual Recycled / Recovered Material (KG) <span style={{ color: '#047857', fontWeight: 800 }}>*Crucial for CC</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={receivedKg}
                  required
                  value={recycledKg}
                  onChange={(e) => handleRecycledChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '2px solid #047857',
                    background: '#F0FDF4',
                    color: '#065F46',
                    fontSize: '16px',
                    fontWeight: 900,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Residual / Rejected Weight */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Non-Recyclable Waste / Inert Residue (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={rejectedKg}
                  onChange={(e) => setRejectedKg(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Live Carbon Credit Minting Preview */}
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                    Calculated Carbon Offsets (Formula: {recycledKg}kg × {currentCcFactor})
                  </div>
                  <div style={{ fontSize: '11px', color: '#065F46', marginTop: '2px' }}>
                    Will be credited directly to client generator balances.
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#047857' }}>
                    +{previewCarbonCredits} <span style={{ fontSize: '12px' }}>CC</span>
                  </div>
                </div>
              </div>

              {/* Inspector Sign-off */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Chief Inspector Signature
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Processing Notes / Batch Batch #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Compost Batch 4A"
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAudit}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: submittingAudit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submittingAudit ? 'Submitting & Minting...' : 'Certify & Mint Carbon Credits'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <DashboardAssistant dashboardName="recycling_plant" accent="#064E3B" />
    </div>
  );
}
