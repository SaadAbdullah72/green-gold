import React, { useState, useEffect } from 'react';
import { MOCK_DATA } from './mockData';
import LoginGate from './components/LoginGate';
import ManagementDashboard from './components/ManagementDashboard';
import UserDashboard from './components/UserDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import LogisticsDashboard from './components/LogisticsDashboard';
import ProcessingPlantDashboard from './components/ProcessingPlantDashboard'; // 👈 Updated Dashboard Import
import QALabDashboard from './components/QALabDashboard';
import MarketplaceDashboard from './components/MarketplaceDashboard';
import WasteCollectorDashboard from './components/WasteCollectorDashboard';

function FloatingParticles() {
  return (
    <div className="bg-leaf-emitter">
      <div className="bg-particle" style={{ width: '40px', height: '18px', left: '15%', top: '20%', animationDelay: '0s', animationDuration: '14s' }}></div>
      <div className="bg-particle" style={{ width: '30px', height: '14px', left: '45%', top: '50%', animationDelay: '2s', animationDuration: '18s' }}></div>
      <div className="bg-particle" style={{ width: '50px', height: '22px', left: '75%', top: '10%', animationDelay: '4s', animationDuration: '16s' }}></div>
      <div className="bg-particle" style={{ width: '35px', height: '16px', left: '60%', top: '80%', animationDelay: '1s', animationDuration: '20s' }}></div>
      <div className="bg-particle" style={{ width: '45px', height: '20px', left: '85%', top: '65%', animationDelay: '6s', animationDuration: '15s' }}></div>
    </div>
  );
}

import { IconBrandLogo, IconBox, IconTruck, IconLeaf } from './components/Icons';

export default function App() {
  const [isLanding, setIsLanding] = useState(true);
  const [role, setRole] = useState('login'); 
  const [username, setUsername] = useState('General Manager');
  const [activeSubTab, setActiveSubTab] = useState('approvals');
  const [userData, setUserData] = useState(null);

  function dbClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }



  // =========================================================================
  // 2. MOCK DATABASE (CLONED STATE)
  // =========================================================================
  const [stats, setStats] = useState(dbClone(MOCK_DATA.stats)); // KPI indicators
  const [activeSites, setActiveSites] = useState(dbClone(MOCK_DATA.activeSites)); // Active zones & agreements
  const [installRequests, setInstallRequests] = useState(dbClone(MOCK_DATA.installRequests)); // New smart bin applications
  const [batchesAwaitingCert, setBatchesAwaitingCert] = useState(dbClone(MOCK_DATA.batchesAwaitingCert)); // Soil-attested compost batches
  const [collectedWasteQueue, setCollectedWasteQueue] = useState(dbClone(MOCK_DATA.collectedWasteQueue)); // Emptying events needing logistics
  const [logs, setLogs] = useState(dbClone(MOCK_DATA.logs)); // Executed admin action audit logs

  // =========================================================================
  // WASTE COLLECTOR PORTAL REACTIVE DATABASE STATE
  // =========================================================================
  const [collectorTasks, setCollectorTasks] = useState(dbClone(MOCK_DATA.collectorTasks));
  const [collectorNotifications, setCollectorNotifications] = useState(dbClone(MOCK_DATA.collectorNotifications));
  const [collectorPerformance, setCollectorPerformance] = useState(dbClone(MOCK_DATA.collectorPerformance));
  const [collectorShift, setCollectorShift] = useState(dbClone(MOCK_DATA.collectorShift));

  // =========================================================================
  // 3. FACTORY REPORTS FILTER STATE
  // =========================================================================
  const [factoryPeriod, setFactoryPeriod] = useState('weekly'); // Toggles weekly vs monthly recyclables reporting

  // =========================================================================
  // 4. TECH ASSIGNMENT MODAL STATE (BIN APPROVALS FLOW)
  // =========================================================================
  const [showTechModal, setShowTechModal] = useState(false); // Controls technician crew selection overlay
  const [pendingReqId, setPendingReqId] = useState(null); // Tracks target request ID during approval

  // =========================================================================
  // 5. CARRIER DISPATCH MODAL STATE (LOGISTICS FLOW)
  // =========================================================================
  const [showLogisticsModal, setShowLogisticsModal] = useState(false); // Controls logistics partner select overlay
  const [pendingWasteId, setPendingWasteId] = useState(null); // Tracks target waste ID during dispatch routing

  useEffect(() => {
    window.history.replaceState({ role: 'login' }, '');
    const handlePopState = () => setRole('login');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const logActivity = (category, message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullTime = `${new Date().toISOString().split('T')[0]} ${time}`;
    setLogs(prev => [{ timestamp: fullTime, category, message }, ...prev]);
  };

  const handleLogin = (selectedRole, payload = null) => {
    let targetRole = 'login';
    
    if (selectedRole === 'management') {
      targetRole = 'management';
      setUsername('General Manager');
    } else if (selectedRole === 'generator') {
      targetRole = 'generator';
      if (payload) {
        setUserData(payload);
        setUsername(payload.organizationName || payload.fullName || 'Waste Generator');
      } else {
        setUsername('Marriott Manager');
      }
    } else if (selectedRole === 'installer') {
      targetRole = 'installer';
      setUsername('Lead Installer');
    } else if (selectedRole === 'collector') {
      targetRole = 'collector';
      setUsername('Driver E-04');
    } else if (selectedRole === 'logistics') {
      targetRole = 'logistics';
      setUsername('Driver E-04');
    } else if (selectedRole === 'composition' || selectedRole === 'processor') {
      targetRole = 'processor';
      setUsername('Plant Supervisor');
    } else if (selectedRole === 'qa') {
      targetRole = 'qa';
      setUsername('QA Specialist');
    } else if (selectedRole === 'buyer') {
      targetRole = 'buyer';
      setUsername('Green Marketplace Buyer');
    }

    setRole(targetRole);
    window.history.pushState({ role: targetRole }, '');
  };

  const handleBackToLogin = () => {
    setRole('login');
    window.history.pushState({ role: 'login' }, '');
  };

  // Helper actions
  const handleApproveReq = (reqId) => { setPendingReqId(reqId); setShowTechModal(true); };
  const confirmApproveReq = (crew) => {
    const req = installRequests.find(r => r.id === pendingReqId);
    if (!req) return;
    setInstallRequests(prev => prev.map(r => r.id === pendingReqId ? { ...r, status: 'Approved', assignedCrew: crew.name } : r));
    setStats(prev => ({ ...prev, activeBins: prev.activeBins + req.binsRequested }));
    setActiveSites(prev => [...prev, { id: `SITE-0${prev.length + 1}`, name: req.org, bins: req.binsRequested, sortAccuracy: 100.0, status: 'Compliant' }]);
    setShowTechModal(false);
  };
  const handleDenyReq = (reqId) => {
    setInstallRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Denied' } : r));
  };
  const handleAssignLogistics = (wasteId) => { setPendingWasteId(wasteId); setShowLogisticsModal(true); };
  const confirmAssignLogistics = (partner) => {
    const waste = collectedWasteQueue.find(w => w.id === pendingWasteId);
    if (!waste) return;
    setCollectedWasteQueue(prev => prev.filter(w => w.id !== pendingWasteId));
    setStats(prev => ({ ...prev, totalWasteDivertedKg: prev.totalWasteDivertedKg + waste.weightKg }));
    setShowLogisticsModal(false);
  };
  const handleCertifyCarbon = (batchId) => {
    setBatchesAwaitingCert(prev => prev.filter(b => b.id !== batchId));
  };

  // =========================================================================
  // 8B. WASTE COLLECTOR OPERATIONS HANDLERS
  // =========================================================================

  const handleUpdateCollectorTaskStatus = (taskId, newStatus) => {
    setCollectorTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
    
    const task = collectorTasks.find(t => t.id === taskId);
    const locationName = task ? task.collectionPoint : taskId;
    logActivity('Logistics', `Driver E-04 updated status for ${locationName} (${taskId}) to '${newStatus}'.`);
  };

  const handleCompleteCollectorCollection = (taskId, completionData) => {
    // 1. Update task details in task list
    setCollectorTasks(prev => prev.map(t => 
      t.id === taskId ? { 
        ...t, 
        status: 'Completed', 
        actualQuantity: completionData.actualQuantity,
        notes: completionData.notes,
        binStatus: 'Normal',
        fillLevel: 0
      } : t
    ));

    const task = collectorTasks.find(t => t.id === taskId);
    const locationName = task ? task.collectionPoint : taskId;
    const qty = completionData.actualQuantity;
    const carbonCredits = parseFloat((qty * 0.000912).toFixed(4));

    // 2. Increment stats globally
    setStats(prev => ({
      ...prev,
      totalWasteDivertedKg: prev.totalWasteDivertedKg + qty,
      pendingCarbonCreditsMt: parseFloat((prev.pendingCarbonCreditsMt + carbonCredits).toFixed(3))
    }));

    // 3. Update collector performance state
    setCollectorPerformance(prev => {
      const newCompleted = prev.tasksCompletedToday + 1;
      const totalToday = prev.totalAssignedToday;
      const newCompletionRate = totalToday > 0 ? parseFloat(((newCompleted / totalToday) * 100).toFixed(1)) : prev.completionRate;
      return {
        ...prev,
        tasksCompletedToday: newCompleted,
        weeklyCollectionsKg: prev.weeklyCollectionsKg + qty,
        completionRate: newCompletionRate,
        weeklyTasksCompleted: prev.weeklyTasksCompleted + 1
      };
    });

    logActivity('Logistics', `Driver E-04 COMPLETED collection at ${locationName}. Diverted: ${qty} kg. Carbon offset logged: ${carbonCredits} MT.`);

    // 4. Trigger alert if driver flagged a placement issue
    if (completionData.reportedIssue) {
      setCollectorNotifications(prev => [
        {
          id: `NOTIF-${Date.now()}`,
          message: `Issue reported during collection at ${locationName}: ${completionData.reportedIssue}`,
          time: "Just now",
          type: "alert",
          read: false
        },
        ...prev
      ]);
    }
  };

  const handleReportCollectorIssue = (taskId, issueData) => {
    // 1. Update task status in task list
    setCollectorTasks(prev => prev.map(t => 
      t.id === taskId ? { 
        ...t, 
        status: 'Reported Issue',
        binStatus: issueData.issueType === 'Bin damaged' ? 'Damaged' : issueData.issueType === 'Bin overflowing' ? 'Overflowing' : t.binStatus
      } : t
    ));

    const task = collectorTasks.find(t => t.id === taskId);
    const locationName = task ? task.collectionPoint : taskId;

    // 2. Increment collector performance issue count
    setCollectorPerformance(prev => ({
      ...prev,
      reportedIssuesCount: prev.reportedIssuesCount + 1
    }));

    // 3. Add to notifications
    setCollectorNotifications(prev => [
      {
        id: `NOTIF-${Date.now()}`,
        message: `New field issue reported for ${locationName}: ${issueData.issueType} (${issueData.priority} Priority).`,
        time: "Just now",
        type: "alert",
        read: false
      },
      ...prev
    ]);

    logActivity('System', `Driver E-04 flagged ISSUE at ${locationName}: ${issueData.issueType} - "${issueData.description}" (${issueData.priority} urgency).`);
  };

  const handleToggleCollectorShiftStatus = (newStatus) => {
    setCollectorShift(prev => ({
      ...prev,
      availabilityStatus: newStatus
    }));

    logActivity('System', `Driver E-04 shift status updated to '${newStatus}'.`);
  };

  const handleClearCollectorNotification = (notifId) => {
    setCollectorNotifications(prev => prev.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    ));
  };

  // ROUTING CONTROLLER
  if (role === 'management') {
    return (
      <ManagementDashboard
        username={username}
        onLogout={handleBackToLogin}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        stats={stats}
        activeSites={activeSites}
        installRequests={installRequests}
        batchesAwaitingCert={batchesAwaitingCert}
        collectedWasteQueue={collectedWasteQueue}
        logs={logs}
        factoryPeriod={factoryPeriod}
        setFactoryPeriod={setFactoryPeriod}
        handleApproveReq={handleApproveReq}
        handleDenyReq={handleDenyReq}
        handleCertifyCarbon={handleCertifyCarbon}
        handleAssignLogistics={handleAssignLogistics}
        showTechModal={showTechModal}
        setShowTechModal={setShowTechModal}
        confirmApproveReq={confirmApproveReq}
        showLogisticsModal={showLogisticsModal}
        setShowLogisticsModal={setShowLogisticsModal}
        confirmAssignLogistics={confirmAssignLogistics}
      />
    );
  }

  if (role === 'collector') {
    return (
      <WasteCollectorDashboard
        username={username}
        onLogout={handleBackToLogin}
        tasks={collectorTasks}
        notifications={collectorNotifications}
        performance={collectorPerformance}
        shift={collectorShift}
        onUpdateTaskStatus={handleUpdateCollectorTaskStatus}
        onCompleteCollection={handleCompleteCollectorCollection}
        onReportIssue={handleReportCollectorIssue}
        onToggleShiftStatus={handleToggleCollectorShiftStatus}
        onClearNotification={handleClearCollectorNotification}
      />
    );
  }

  if (role === 'generator') {
    return <UserDashboard username={username} userData={userData} onLogout={handleBackToLogin} />;
  }

  if (role === 'installer') {
    return <TechnicianDashboard username={username} onLogout={handleBackToLogin} />;
  }

  if (role === 'logistics') {
    return <LogisticsDashboard username={username} onLogout={handleBackToLogin} />;
  }

  // 👈 Route to ProcessingPlantDashboard
  if (role === 'processor') {
    return <ProcessingPlantDashboard username={username} onLogout={handleBackToLogin} />;
  }

  if (role === 'qa') {
    return <QALabDashboard username={username} onLogout={handleBackToLogin} />;
  }

  if (role === 'buyer') {
    return <MarketplaceDashboard username={username} onLogout={handleBackToLogin} />;
  }

  // DEFAULT / LOGIN SCREEN
  if (isLanding) {
    return (
      <div style={{ background: 'var(--bg-app)', minHeight: '100vh', padding: '0 20px 60px 20px', position: 'relative' }}>
        {/* STICKY FLOATING GLASS NAVBAR */}
        <nav className="glass-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconBrandLogo size={36} />
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              GreenGold<span style={{ color: 'var(--primary)' }}>OS</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>Ecosystem</span>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>IoT Telemetry</span>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>ESG Carbon</span>
            <button className="btn-emerald" style={{ height: '40px', padding: '0 20px', fontSize: '13px' }} onClick={() => setIsLanding(false)}>
              Access System Portal ➔
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section style={{ maxWidth: '860px', margin: '90px auto 80px auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <IconBrandLogo size={110} />
          </div>

          <h1 style={{ fontSize: '56px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.12', marginBottom: '28px', letterSpacing: '-0.035em' }}>
            Circular Bio-Waste Telemetry <br />
            <span style={{ color: 'var(--primary)' }}>& Certified Carbon Offsets</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 44px auto', lineHeight: '1.65' }}>
            Smart bin IoT telemetry, automated fleet dispatch, thermophilic composting analytics, and laboratory-verified carbon credit attestation.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="btn-emerald" style={{ padding: '0 32px', height: '52px', fontSize: '15px' }} onClick={() => setIsLanding(false)}>
              Access Portal Command ➔
            </button>
          </div>
        </section>

        {/* KEY STATISTICS BAR */}
        <section style={{ maxWidth: '960px', margin: '0 auto 100px auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="soft-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '6px' }}>135+</div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Smart Bins Online</div>
            </div>
            <div className="soft-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.03em', marginBottom: '6px' }}>1,200 kg</div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Organic Waste Diverted</div>
            </div>
            <div className="soft-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '6px' }}>3.45 MT</div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>CO2e Minted Credits</div>
            </div>
          </div>
        </section>

        {/* 3-STEP WORKFLOW GRID */}
        <section style={{ maxWidth: '1000px', margin: '0 auto 100px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>How GreenGoldOS Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Automated circular transformation pipeline.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            <div className="soft-card" style={{ padding: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconBox size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>1. Smart Telemetry</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Sensors record bin fill levels. Automatic dispatch signals are sent when thresholds are breached.
              </p>
            </div>

            <div className="soft-card" style={{ padding: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconTruck size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>2. Logistics & Composting</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Automated route dispatch transports waste to composting yards for thermophilic aeration digestion.
              </p>
            </div>

            <div className="soft-card" style={{ padding: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconLeaf size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>3. QA & Carbon Credit</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Soil lab scientists certify NPK ratios before administrators issue verified CO2 offset tokens.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
          GreenGoldOS © 2026 — Enterprise Circular Bio-Waste & Carbon Intelligence.
        </footer>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <LoginGate 
        onLogin={handleLogin} 
        onLoginSuccess={(data) => handleLogin('generator', data)} 
      />
    </div>
  );
}