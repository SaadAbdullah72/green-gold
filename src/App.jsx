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

export default function App() {
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
  return (
    <LoginGate 
      onLogin={handleLogin} 
      onLoginSuccess={(data) => handleLogin('generator', data)} 
    />
  );
}