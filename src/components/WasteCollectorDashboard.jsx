import React, { useState, useEffect } from 'react';
import { IconBrandLogo, IconBox, IconUser } from './Icons';
import { api } from '../api';

export default function WasteCollectorDashboard({ username, userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('assigned_jobs');

  // Backend Real Jobs State
  const [realJobs, setRealJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Complete Work Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [targetJob, setTargetJob] = useState(null);
  const [installedBinsCount, setInstalledBinsCount] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState('');
  const [notes, setNotes] = useState('');

  const loadTechnicalJobs = async () => {
    try {
      const res = await api.technical.getJobs();
      if (res.jobs) {
        setRealJobs(prev => JSON.stringify(prev) !== JSON.stringify(res.jobs) ? res.jobs : prev);
      }
    } catch (err) {
      // silent catch for background polling
    }
  };

  useEffect(() => {
    loadTechnicalJobs();
    const timer = setInterval(loadTechnicalJobs, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAcceptJob = async (jobId) => {
    try {
      const res = await api.technical.acceptJob(jobId);
      setActionMsg(res.message || 'Job accepted successfully');
      setTimeout(() => setActionMsg(''), 3000);
      await loadTechnicalJobs();
    } catch (err) {
      alert(`Accept Error: ${err.message}`);
    }
  };

  const handleStartWork = async (jobId) => {
    try {
      const res = await api.technical.startWork(jobId);
      setActionMsg(res.message || 'Work started on site');
      setTimeout(() => setActionMsg(''), 3000);
      await loadTechnicalJobs();
    } catch (err) {
      alert(`Start Work Error: ${err.message}`);
    }
  };

  const handleDelayJob = async (jobId) => {
    const delayReason = prompt('Please enter reason for partial delay (e.g. Site gate access delayed / hardware configuration issue):');
    if (!delayReason) return;
    try {
      const res = await api.technical.delayJob(jobId, delayReason);
      setActionMsg(res.message || 'Task marked as Partially Delayed');
      setTimeout(() => setActionMsg(''), 4000);
      await loadTechnicalJobs();
    } catch (err) {
      alert(`Delay Error: ${err.message}`);
    }
  };

  const handleOpenCompleteModal = (job) => {
    setTargetJob(job);
    setInstalledBinsCount(job.binsAssigned || 1);
    setSerialNumbers(`SN-240L-${Math.floor(1000 + Math.random() * 9000)}`);
    setNotes('');
    setShowCompleteModal(true);
  };

  const handleSubmitCompleteWork = async (e) => {
    e.preventDefault();
    if (!targetJob) return;
    try {
      await api.technical.completeWork(targetJob._id, {
        binsInstalled: parseInt(installedBinsCount, 10),
        serialNumbers,
        notes
      });
      setShowCompleteModal(false);
      setActionMsg('Job completed successfully and recorded in MongoDB!');
      setTimeout(() => setActionMsg(''), 4000);
      await loadTechnicalJobs();
    } catch (err) {
      alert(`Completion Error: ${err.message}`);
    }
  };

  // Extract User Details
  const workerName = userData?.fullName || username || 'Technical Worker';
  const employeeId = userData?.employeeId || 'T-101';
  const workerPhone = userData?.phone || '+92 321 1002001';
  const secondaryPhone = userData?.secondaryPhone || '+92 321 9998877';

  // Filter Jobs
  const activeAssignedJobs = realJobs.filter(j => j.status !== 'COMPLETED');
  const completedJobsHistory = realJobs.filter(j => j.status === 'COMPLETED');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAF6', fontFamily: 'var(--font-body)' }}>
      
      {/* COMPLETE WORK MODAL OVERLAY */}
      {showCompleteModal && targetJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="soft-card" style={{ maxWidth: '520px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Complete Bin Installation Handshake
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: '1.4' }}>
              Job Ref: <strong>{targetJob.request?.requestNumber || targetJob._id}</strong> — {targetJob.request?.organizationName || 'Customer Facility'}
            </p>

            <form onSubmit={handleSubmitCompleteWork}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Bins Successfully Installed *
                </label>
                <input
                  type="number"
                  className="modern-input"
                  min="1"
                  max={targetJob.binsAssigned || 5}
                  value={installedBinsCount}
                  onChange={(e) => setInstalledBinsCount(e.target.value)}
                  required
                  style={{ width: '100%', height: '44px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  IoT Sensor Serial Numbers *
                </label>
                <input
                  type="text"
                  className="modern-input"
                  value={serialNumbers}
                  onChange={(e) => setSerialNumbers(e.target.value)}
                  required
                  style={{ width: '100%', height: '44px' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Installation Notes (Optional)
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="e.g. Wall mounted ultrasonic sensor calibrated."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', height: '44px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-eco-secondary"
                  onClick={() => setShowCompleteModal(false)}
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-eco-primary"
                  style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '800' }}
                >
                  Submit & Complete Work »
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXECUTIVE DARK SIDEBAR */}
      <aside style={{ width: '280px', background: '#0B2822', color: '#FFFFFF', padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '0 8px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                GreenGold OS
              </h2>
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Technical Workforce Console
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', padding: '0 8px' }}>
            Field Operations
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('assigned_jobs')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'assigned_jobs' ? '#10B981' : 'transparent',
                color: activeTab === 'assigned_jobs' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <IconBox size={20} />
              Assigned Jobs Queue
              {activeAssignedJobs.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#34D399', color: '#064E3B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                  {activeAssignedJobs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'history' ? '#10B981' : 'transparent',
                color: activeTab === 'history' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <IconUser size={20} />
              Completed Jobs History
              {completedJobsHistory.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                  {completedJobsHistory.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Technical Profile Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#34D399', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TECHNICAL WORKER PROFILE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#FFFFFF', marginTop: '2px' }}>
              {workerName}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B', marginTop: '2px' }}>
              Employee ID: {employeeId}
            </div>
            <div style={{ fontSize: '11px', color: '#A7F3D0', marginTop: '4px' }}>
              Primary: {workerPhone}
            </div>
            {secondaryPhone && (
              <div style={{ fontSize: '11px', color: '#A7F3D0' }}>
                Secondary: {secondaryPhone}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#A7F3D0', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Logout Portal »
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Technical Worker Dispatch Console ({employeeId})
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
              Logged in as <strong>{workerName}</strong> (Employee ID: <strong>{employeeId}</strong>). Real-time job acceptance & installation.
            </p>
          </div>
        </header>

        {actionMsg && (
          <div style={{ padding: '12px 16px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', borderRadius: '12px', fontSize: '14px', fontWeight: '700', marginBottom: '24px' }}>
            {actionMsg}
          </div>
        )}

        {/* =========================================================================
            TAB 1: ASSIGNED JOBS QUEUE
            ========================================================================= */}
        {activeTab === 'assigned_jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeAssignedJobs.length === 0 ? (
              <div className="soft-card" style={{ padding: '48px', background: '#FFFFFF', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <IconBox size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  No Active Jobs Assigned
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0, maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                  When Operations Management assigns a new smart bin deployment task to your Employee ID ({employeeId}), it will immediately appear here.
                </p>
              </div>
            ) : (
              activeAssignedJobs.map(job => {
                const req = job.request || {};
                const isAssignedPending = job.status === 'ASSIGNED';
                const isWorking = job.status === 'WORKING' || job.status === 'ACCEPTED';
                
                // Calculate response deadline countdown
                const deadlineTime = job.responseDeadline ? new Date(job.responseDeadline).getTime() : Date.now() + 300000;
                const secondsLeft = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
                const mins = Math.floor(secondsLeft / 60);
                const secs = String(secondsLeft % 60).padStart(2, '0');

                return (
                  <div key={job._id} className="soft-card" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          REQUEST #{req.requestNumber || 'REQ-2026-0001'}
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: '2px 0 0 0' }}>
                          {req.organizationName || 'Customer Facility'}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                          Location: {req.address}, {req.town}, {req.city}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span 
                          style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                            background: isWorking ? '#ECFDF5' : isAssignedPending ? '#FEF3C7' : '#EFF6FF',
                            color: isWorking ? '#047857' : isAssignedPending ? '#D97706' : '#1E40AF',
                            border: `1px solid ${isWorking ? '#6EE7B7' : isAssignedPending ? '#FCD34D' : '#BFDBFE'}`
                          }}
                        >
                          STATUS: {job.status}
                        </span>

                        {isAssignedPending && (
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#DC2626', marginTop: '8px' }}>
                            Timer: {mins}:{secs} Left
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Bins Quota</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{job.binsAssigned || 2} Units</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Contact Person</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{req.contactPerson || 'Zeeshan'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Customer Phone</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{req.phone || '+92 300 8889999'}</div>
                      </div>
                    </div>

                    {job.delayReason && (
                      <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                        Delay Note: {job.delayReason}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {isAssignedPending && (
                        <button
                          type="button"
                          className="btn-eco-primary"
                          onClick={() => handleAcceptJob(job._id)}
                          style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '800' }}
                        >
                          Accept Assignment »
                        </button>
                      )}

                      {(job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS' || job.status === 'PARTIALLY_DELAYED') && (
                        <>
                          <button
                            type="button"
                            className="btn-eco-secondary"
                            onClick={() => handleDelayJob(job._id)}
                            style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', borderColor: '#F59E0B', color: '#B45309' }}
                          >
                            Partially Delayed »
                          </button>
                          <button
                            type="button"
                            className="btn-eco-primary"
                            onClick={() => handleOpenCompleteModal(job)}
                            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '800', background: '#047857', borderColor: '#047857' }}
                          >
                            Task Done / Complete »
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: COMPLETED JOBS HISTORY
            ========================================================================= */}
        {activeTab === 'history' && (
          <div className="soft-card" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Completed Installation Jobs
            </h3>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Job Ref</th>
                    <th>Customer Organization</th>
                    <th>Bins Installed</th>
                    <th>IoT Serial #</th>
                    <th>Status</th>
                    <th>Date Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobsHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                        No completed installation jobs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    completedJobsHistory.map(job => (
                      <tr key={job._id}>
                        <td><strong>{job.request?.requestNumber || job._id}</strong></td>
                        <td>{job.request?.organizationName || 'Customer Facility'}</td>
                        <td><strong>{job.binsAssigned || 2} Units</strong></td>
                        <td><code>{job.serialNumbers || 'SN-240L-9001'}</code></td>
                        <td>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#ECFDF5', color: '#047857', border: '1px solid #6EE7B7' }}>
                            COMPLETED
                          </span>
                        </td>
                        <td>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Today'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
