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
  const [appInitializing, setAppInitializing] = useState(true);
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
    const initTimer = setTimeout(() => {
      setAppInitializing(false);
    }, 2200);

    window.history.replaceState({ role: 'login' }, '');
    const handlePopState = () => setRole('login');
    window.addEventListener('popstate', handlePopState);

    // Auto-restore MongoDB Session on app mount/refresh
    const restoreSession = async () => {
      const token = localStorage.getItem('greengold_token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.user) {
            handleLogin(res.user.role === 'TECHNICAL' ? 'collector' : res.user.role === 'MANAGEMENT' ? 'management' : 'generator', res.user);
          }
        } catch (e) {
          localStorage.removeItem('greengold_token');
        }
      }
    };
    restoreSession();

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const logActivity = (category, message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullTime = `${new Date().toISOString().split('T')[0]} ${time}`;
    setLogs(prev => [{ timestamp: fullTime, category, message }, ...prev]);
  };

  const handleLogin = (selectedRole, payload = null) => {
    let targetRole = 'login';
    
    if (payload) {
      setUserData(payload);
      setUsername(payload.fullName || payload.organizationName || 'User');
      if (payload.role === 'MANAGEMENT') selectedRole = 'management';
      if (payload.role === 'USER') selectedRole = 'generator';
      if (payload.role === 'TECHNICAL') selectedRole = 'collector';
    }

    if (selectedRole === 'management') {
      targetRole = 'management';
      if (!payload) setUsername('General Manager');
    } else if (selectedRole === 'generator') {
      targetRole = 'generator';
      if (!payload) setUsername('Marriott Manager');
    } else if (selectedRole === 'installer') {
      targetRole = 'installer';
      if (!payload) setUsername('Lead Installer');
    } else if (selectedRole === 'collector') {
      targetRole = 'collector';
      if (!payload) setUsername('Driver E-04');
    } else if (selectedRole === 'logistics') {
      targetRole = 'logistics';
      if (!payload) setUsername('Driver E-04');
    } else if (selectedRole === 'composition' || selectedRole === 'processor') {
      targetRole = 'processor';
      if (!payload) setUsername('Plant Supervisor');
    } else if (selectedRole === 'qa') {
      targetRole = 'qa';
      if (!payload) setUsername('QA Specialist');
    } else if (selectedRole === 'buyer') {
      targetRole = 'buyer';
      if (!payload) setUsername('Green Marketplace Buyer');
    }

    setRole(targetRole);
    window.history.pushState({ role: targetRole }, '');
  };

  const handleBackToLogin = () => {
    api.auth.logout();
    localStorage.removeItem('greengold_token');
    setUserData(null);
    setRole('login');
    setIsLanding(true);
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

  // Formal top-left back navigation bar (shown on every dashboard/login page)
  const BackBar = () => (
    <div className="global-back-bar" onClick={handleBackToLogin} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '36px', display: 'flex', alignItems: 'center', gap: '8px',
      padding: '0 20px',
      background: 'linear-gradient(90deg, #0B2822 0%, #0F3D32 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer', userSelect: 'none',
      transition: 'opacity 0.2s'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#A7F3D0', letterSpacing: '0.03em' }}>
        Back to Home
      </span>
    </div>
  );

  // Wrapper that adds padding-top to account for the fixed back bar
  const DashboardWrapper = ({ children }) => (
    <>
      <BackBar />
      <div style={{ paddingTop: '36px' }}>
        {children}
      </div>
    </>
  );

  // Single 2.2 Second Opening Splash Screen (Full White, Large 160px Logo)
  if (appInitializing) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
        <img src="/logo.png" alt="GreenGold OS" style={{ width: '160px', height: '160px', objectFit: 'contain' }} />
        <div style={{ color: '#064E3B', fontSize: '18px', fontWeight: '900', letterSpacing: '0.12em', marginTop: '20px', textTransform: 'uppercase' }}>
          GreenGold OS
        </div>
        <div style={{ color: '#059669', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', marginTop: '4px', textTransform: 'uppercase' }}>
          Smart Waste Management Platform
        </div>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(16, 185, 129, 0.15)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginTop: '24px' }}></div>
      </div>
    );
  }

  // ROUTING CONTROLLER
  if (role === 'management') {
    return (
      <DashboardWrapper>
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
      </DashboardWrapper>
    );
  }

  if (role === 'collector') {
    return (
      <DashboardWrapper>
        <WasteCollectorDashboard
          username={username}
          userData={userData}
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
      </DashboardWrapper>
    );
  }

  if (role === 'generator') {
    return <DashboardWrapper><UserDashboard username={username} userData={userData} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  if (role === 'installer') {
    return <DashboardWrapper><TechnicianDashboard username={username} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  if (role === 'logistics') {
    return <DashboardWrapper><LogisticsDashboard username={username} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  // 👈 Route to ProcessingPlantDashboard
  if (role === 'processor') {
    return <DashboardWrapper><ProcessingPlantDashboard username={username} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  if (role === 'qa') {
    return <DashboardWrapper><QALabDashboard username={username} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  if (role === 'buyer') {
    return <DashboardWrapper><MarketplaceDashboard username={username} onLogout={handleBackToLogin} /></DashboardWrapper>;
  }

  // DEFAULT / LOGIN SCREEN
  if (isLanding) {
    return (
      <div style={{ background: 'var(--bg-app)', minHeight: '100vh', position: 'relative' }}>
        {/* CUSTOMIZED ECO NAVBAR */}
        <nav className="eco-navbar" style={{ padding: '8px 50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Logo (Sleek, Dissolved Background) */}
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setIsLanding(false)}>
            <img src="/logo.png" alt="GreenGold Logo" style={{ width: '76px', height: '76px', objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.1)' }} />
          </div>

          {/* 3 Tabs */}
          <ul className="eco-nav-links" style={{ display: 'flex', gap: '40px', margin: 0, padding: 0, listStyle: 'none', alignItems: 'center' }}>
            <li className="eco-nav-item" style={{ fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}>Services</li>
            <li className="eco-nav-item" style={{ fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth' })}>Info</li>
            <li className="eco-nav-item" style={{ fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'color 0.3s' }} onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}>Contact</li>
          </ul>

          {/* Contact Details on Right (Professional & Minimal) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', transition: 'opacity 0.2s', cursor: 'pointer', opacity: 0.9 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '0.3px' }}>contact@greengoldos.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', transition: 'opacity 0.2s', cursor: 'pointer', opacity: 0.9 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '0.3px' }}>+1 (800) 555-0199</span>
            </div>
          </div>
        </nav>
        {/* HERO SECTION */}
        <section className="eco-hero">
          {/* Vertical Pagination Dots */}
          <div className="eco-hero-pagination">
            <div className="eco-dot active"></div>
            <div className="eco-dot"></div>
          </div>

          <div className="eco-hero-tag">NATURAL ENVIRONMENT</div>

          <h1 className="eco-hero-title">
            Leading the way to <br />
            a greener future
          </h1>

          <p className="eco-hero-desc">
            GreenGold OS is a revolutionary smart waste management platform utilizing IoT technology and AI to drive a sustainable, zero-emissions circular economy.
          </p>

          <div className="eco-hero-actions">
            <button className="btn-eco-primary" onClick={() => setIsLanding(false)}>
              Join Us Now »
            </button>
            <button className="btn-eco-secondary" onClick={() => setIsLanding(false)}>
              Get Started »
            </button>
          </div>



          {/* Slider Controls Removed */}
        </section>

        {/* ABOUT SECTION ("Building a greener future together Forever") */}
        <section id="info-section" className="eco-about-section">
          <div className="eco-about-grid">
            <div className="eco-about-image-wrapper">
              <div className="eco-about-img-frame"></div>
              <img src="/ecofine_about.png" alt="Ecofine Sustainability" className="eco-about-img-main" />
            </div>

            <div>
              <div className="eco-about-tag">ABOUT WITH US</div>
              <h2 className="eco-about-title">
                Building a greener <br />
                future together Forever
              </h2>
              <p className="eco-about-desc" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '18px', lineHeight: '1.6', color: '#475569' }}>
                Our comprehensive platform empowers cities and businesses to efficiently manage organic waste. From automated smart bin collection to carbon certification and an integrated compost marketplace, GreenGold OS ensures transparency, accountability, and maximum sustainability at every step. Join us in transforming waste into wealth and paving the way for a cleaner, greener planet.
              </p>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION ("Preserving The Earth For Future Generations") */}
        <section id="services-section" className="eco-services-section">
          <div className="eco-services-header">
            <div className="eco-services-tag">OUR SERVICES</div>
            <h2 className="eco-services-title">
              Preserving The Earth For Future Generations
            </h2>
          </div>

          <div className="eco-services-grid">
            <div className="eco-service-card">
              <div className="eco-service-icon-badge">
                <IconLeaf size={32} />
              </div>
              <h3>Carbon Offsetting</h3>
              <p>This allows individuals and organizations to support their efforts to combat carbon climate change.</p>
            </div>

            <div className="eco-service-card">
              <div className="eco-service-icon-badge">
                <IconBox size={32} />
              </div>
              <h3>Energy Consulting</h3>
              <p>Energy consulting involves providing expert advice and guidance on energy-related matters.</p>
            </div>

            <div className="eco-service-card">
              <div className="eco-service-icon-badge">
                <IconTruck size={32} />
              </div>
              <h3>Climate Adaptation</h3>
              <p>Refers to the adaptation process of human and natural systems in response to the impacts.</p>
            </div>
          </div>

          {/* STAT COUNTER GRID BAR */}
          <div className="eco-counter-bar">
            <div className="eco-counter-item">
              <div className="eco-counter-val">200+</div>
              <div className="eco-counter-lbl">Smart Bio-Bins Active</div>
            </div>
            <div className="eco-counter-item">
              <div className="eco-counter-val">10+</div>
              <div className="eco-counter-lbl">Processing Hubs</div>
            </div>
            <div className="eco-counter-item">
              <div className="eco-counter-val">20+</div>
              <div className="eco-counter-lbl">Certified Farms</div>
            </div>
            <div className="eco-counter-item">
              <div className="eco-counter-val">20+</div>
              <div className="eco-counter-lbl">MT CO2e Offsets</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="contact-section" className="eco-footer">
          Ecofine & GreenGoldOS © 2026 — Leading the way to a greener future.
        </footer>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <BackBar />
      <div style={{ paddingTop: '36px' }}>
        <LoginGate 
          onLogin={handleLogin} 
          onLoginSuccess={(data) => handleLogin('generator', data)} 
        />
      </div>
    </div>
  );
}