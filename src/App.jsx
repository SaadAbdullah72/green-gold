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

export default function App() {
  const [role, setRole] = useState('login'); 
  const [username, setUsername] = useState('General Manager');
  const [activeSubTab, setActiveSubTab] = useState('approvals');
  const [userData, setUserData] = useState(null);

  function dbClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const [stats, setStats] = useState(dbClone(MOCK_DATA.stats));
  const [activeSites, setActiveSites] = useState(dbClone(MOCK_DATA.activeSites));
  const [installRequests, setInstallRequests] = useState(dbClone(MOCK_DATA.installRequests));
  const [batchesAwaitingCert, setBatchesAwaitingCert] = useState(dbClone(MOCK_DATA.batchesAwaitingCert));
  const [collectedWasteQueue, setCollectedWasteQueue] = useState(dbClone(MOCK_DATA.collectedWasteQueue));
  const [logs, setLogs] = useState(dbClone(MOCK_DATA.logs));

  const [factoryPeriod, setFactoryPeriod] = useState('weekly');
  const [showTechModal, setShowTechModal] = useState(false);
  const [pendingReqId, setPendingReqId] = useState(null);
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [pendingWasteId, setPendingWasteId] = useState(null);

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
    } else if (selectedRole === 'collector' || selectedRole === 'logistics') {
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