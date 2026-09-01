import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { IconBox, IconTruck, IconUser } from './Icons';
import DashboardAssistant from './DashboardAssistant';
import RequestProgressTracker from './RequestProgressTracker';
import GreenGoldLogo from './GreenGoldLogo';

const workerProfile = {
  name: 'Ahmed Nawaz',
  employeeId: 'T-104',
  primaryPhone: '+923252724238',
  secondaryPhone: '+923227244238'
};

export default function TechnicianDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('assigned_jobs');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [now, setNow] = useState(Date.now());

  const normalizeJob = (job) => {
    const request = job?.request || {};
    const requestNumber = request.requestNumber || 'REQ-2026-0004';
    const status = job?.status || 'ASSIGNED';

    return {
      _id: job?._id || job?.id || String(Math.random()),
      status,
      requestNumber,
      organizationName: request.organizationName || 'Customer Portal',
      location: `${request.address || 'Plot 18, Blue Area'}, ${request.city || 'Islamabad'}`,
      contactPerson: request.contactPerson || 'Customer Portal',
      phone: request.phone || '+92 300 1234567',
      binsAssigned: job?.binsAssigned || 2,
      responseDeadline: job?.responseDeadline || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      updatedAt: job?.updatedAt || new Date().toISOString(),
      delayReason: job?.delayReason || null
    };
  };

  const loadJobs = async (silent = false) => {
    try {
      if (!silent) setLoadingJobs(true);
      const res = await api.technical.getJobs();
      const nextJobs = Array.isArray(res?.jobs) ? res.jobs : [];
      setJobs(nextJobs.map(normalizeJob));
    } catch (error) {
      console.error('Failed to load technician jobs:', error);
      if (!silent) setJobs([]);
    } finally {
      if (!silent) setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs(false);
    const pollTimer = setInterval(() => {
      loadJobs(true); // Silent background polling without triggering re-render flickering
    }, 4000);
    return () => clearInterval(pollTimer);
  }, []);

  const activeAssignedJobs = useMemo(
    () => jobs.filter((job) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PARTIALLY_DELAYED'].includes(job.status)),
    [jobs]
  );

  const completedJobsHistory = useMemo(
    () => jobs.filter((job) => job.status === 'COMPLETED'),
    [jobs]
  );

  const handleStageUpdate = async (jobId, nextStatus) => {
    try {
      if (nextStatus === 'ACCEPTED') {
        await api.technical.acceptJob(jobId);
      } else if (nextStatus === 'IN_PROGRESS') {
        await api.technical.startWork(jobId);
      } else if (nextStatus === 'COMPLETED') {
        await api.technical.completeWork(jobId, { binsInstalled: 2, serialNumbers: 'SN-GG-TRACKER', notes: 'Updated from progress tracker' });
      }
      await loadJobs(true);
    } catch (error) {
      console.error('Failed to update job stage:', error);
    }
  };

  const handleStartWork = async (jobId) => {
    try {
      await api.technical.startWork(jobId);
      await loadJobs(true);
    } catch (error) {
      console.error('Failed to start job:', error);
      alert('Error starting work: ' + error.message);
    }
  };

  const handleCompleteWork = async (jobId) => {
    try {
      await api.technical.completeWork(jobId, { binsInstalled: 2, notes: 'Smart bins deployed and verified by technician' });
      await loadJobs(true);
    } catch (error) {
      console.error('Failed to complete job:', error);
      alert('Error completing work: ' + error.message);
    }
  };

  const getTimerText = (deadline) => {
    const target = new Date(deadline).getTime();
    const secondsLeft = Math.max(0, Math.floor((target - now) / 1000));
    const mins = Math.floor(secondsLeft / 60);
    const secs = String(secondsLeft % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#E5E7EB' }}>
      <aside
        style={{
          width: '320px',
          background: '#022F2B',
          color: '#E6FFFB',
          padding: '20px 18px 16px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ padding: '8px 8px 24px' }}>
          <GreenGoldLogo size={42} subtitle="Technical Workforce" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('assigned_jobs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              background: activeTab === 'assigned_jobs' ? '#10B981' : 'transparent',
              color: activeTab === 'assigned_jobs' ? '#FFFFFF' : '#A7F3D0',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <IconTruck size={20} color={activeTab === 'assigned_jobs' ? '#FFFFFF' : '#A7F3D0'} />
            <span>Assigned Jobs Queue</span>
            {activeAssignedJobs.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#34D399', color: '#064E3B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                {activeAssignedJobs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              background: activeTab === 'history' ? '#10B981' : 'transparent',
              color: activeTab === 'history' ? '#FFFFFF' : '#A7F3D0',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            <IconUser size={20} color={activeTab === 'history' ? '#FFFFFF' : '#A7F3D0'} />
            <span>Completed Jobs History</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Technical Worker Profile
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>{workerProfile.name}</div>
          <div style={{ fontSize: '13px', color: '#F9C74F', fontWeight: 700, marginTop: '2px' }}>Employee ID: {workerProfile.employeeId}</div>
          <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '8px' }}>Primary: {workerProfile.primaryPhone}</div>
          <div style={{ fontSize: '12px', color: '#A7F3D0' }}>Secondary: {workerProfile.secondaryPhone}</div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            marginTop: '18px',
            width: '100%',
            background: 'transparent',
            color: '#A7F3D0',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Logout Portal »
        </button>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px 32px', background: '#F8FAF8' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', lineHeight: 1.2, color: '#0F172A', fontWeight: 900 }}>
            Technical Worker Dispatch Console ({workerProfile.employeeId})
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748B' }}>
            Logged in as <strong>{workerProfile.name}</strong> (Employee ID: <strong>{workerProfile.employeeId}</strong>). Real-time job acceptance & installation.
          </p>
        </header>

        {activeTab === 'assigned_jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loadingJobs ? (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '40px 30px', textAlign: 'center', color: '#475569' }}>
                Loading assigned jobs...
              </div>
            ) : activeAssignedJobs.length === 0 ? (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '48px 24px', textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>No Active Jobs Assigned</div>
                <div>When new work is assigned, it will appear here instantly.</div>
              </div>
            ) : (
              activeAssignedJobs.map((job) => {
                const isAssignedPending = job.status === 'ASSIGNED';
                const isWorking = job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS';

                return (
                  <div key={job._id} style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '22px 22px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#047857', textTransform: 'uppercase' }}>
                          Request #{job.requestNumber}
                        </div>
                        <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>
                          {job.organizationName}
                        </h2>
                        <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748B' }}>
                          Location: {job.location}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            background: isWorking ? '#ECFDF5' : isAssignedPending ? '#FEF3C7' : '#EFF6FF',
                            color: isWorking ? '#047857' : isAssignedPending ? '#B45309' : '#1D4ED8',
                            border: `1px solid ${isWorking ? '#6EE7B7' : isAssignedPending ? '#FCD34D' : '#BFDBFE'}`
                          }}
                        >
                          STATUS: {job.status}
                        </span>
                        {isAssignedPending && (
                          <div style={{ marginTop: '8px', color: '#DC2626', fontSize: '13px', fontWeight: 900 }}>
                            Timer: {getTimerText(job.responseDeadline)} Left
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bins Quota</div>
                        <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{job.binsAssigned} Units</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Person</div>
                        <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{job.contactPerson}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer Phone</div>
                        <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{job.phone}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                      <RequestProgressTracker
                        status={job.status}
                        variant="technical"
                        interactive={job.status !== 'COMPLETED'}
                        onStageChange={(stageKey) => handleStageUpdate(job._id, stageKey)}
                        compact={false}
                        label="Installation progress"
                      />
                    </div>

                    {job.delayReason && (
                      <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '13px', fontWeight: 700 }}>
                        Delay Note: {job.delayReason}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
                      {isAssignedPending && (
                        <button
                          type="button"
                          onClick={() => handleStageUpdate(job._id, 'ACCEPTED')}
                          style={{
                            background: '#047857',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)'
                          }}
                        >
                          Accept Assignment
                        </button>
                      )}

                      {job.status === 'ACCEPTED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartWork(job._id)}
                            style={{
                              background: '#1D4ED8',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px 20px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)'
                            }}
                          >
                            Mark Reached Destination (Start Work)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteWork(job._id)}
                            style={{
                              background: '#047857',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '12px 20px',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)'
                            }}
                          >
                            Complete Work & Allot Bins
                          </button>
                        </>
                      )}

                      {job.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteWork(job._id)}
                          style={{
                            background: '#047857',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)'
                          }}
                        >
                          Complete Work & Allot Bins
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '28px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'Georgia, serif' }}>
              Completed Installation Jobs
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#022F2B', color: '#FFFFFF' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Job Ref</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Customer Organization</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Bins Installed</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>IoT Serial #</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Date Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobsHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '28px 14px', textAlign: 'center', color: '#64748B' }}>
                        No completed installation jobs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    completedJobsHistory.map((job) => (
                      <tr key={job._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 14px' }}>{job.requestNumber}</td>
                        <td style={{ padding: '12px 14px' }}>{job.organizationName}</td>
                        <td style={{ padding: '12px 14px' }}>{job.binsAssigned} Units</td>
                        <td style={{ padding: '12px 14px' }}>{job._id.slice(0, 8).toUpperCase()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '5px 10px', borderRadius: '8px', background: '#ECFDF5', color: '#047857', border: '1px solid #6EE7B7', fontSize: '11px', fontWeight: 800 }}>
                            COMPLETED
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{new Date(job.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <DashboardAssistant dashboardName="technician" accent="#10B981" />
    </div>
  );
}
