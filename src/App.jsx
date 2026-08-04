import React, { useState, useEffect } from 'react';
import { MOCK_DATA } from './mockData';
import LoginGate from './components/LoginGate';
import ManagementDashboard from './components/ManagementDashboard';
import UserDashboard from './components/UserDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import LogisticsDashboard from './components/LogisticsDashboard';
import CompostOperatorDashboard from './components/CompostOperatorDashboard';
import QALabDashboard from './components/QALabDashboard';
import MarketplaceDashboard from './components/MarketplaceDashboard';

/**
 * GreenGoldOS Core Root Component
 * 
 * Functions:
 * 1. Global Authentication Routing: Switches views between the gateway portal 
 *    and the user-specific role dashboards.
 * 2. Browser Back-Navigation Interceptor: Uses the HTML5 Popstate API to capture 
 *    browser "Back" clicks and return to the gateway, preventing the user from leaving the app.
 * 3. Shared Database State: Mimics a MERN data layer with reactive React states for 
 *    bins, audits, logistics dispatches, and carbon certifications.
 */
export default function App() {
  
  // =========================================================================
  // 1. ROUTING & ACCESS PROFILE STATE
  // =========================================================================
  const [role, setRole] = useState('login'); // Selected role portal (e.g. 'login', 'management', 'generator')
  const [username, setUsername] = useState('General Manager'); // Simulated active user label
  const [activeSubTab, setActiveSubTab] = useState('approvals'); // Sub-tab active inside Management view

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

  /**
   * Helper utility to clone mock datasets, preventing direct object reference mutations.
   */
  function dbClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // =========================================================================
  // 6. POPSTATE BACK-BUTTON INTERACTION INTERFACE
  // =========================================================================
  useEffect(() => {
    // Prime history index so a back-click doesn't push the browser to an external domain (e.g. Google)
    window.history.replaceState({ role: 'login' }, '');

    const handlePopState = (event) => {
      // Catch popstate events (browser back action) and force rendering of the gateway dashboard.
      setRole('login');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // =========================================================================
  // 7. SYSTEM LOGGING UTILITY
  // =========================================================================
  const logActivity = (category, message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullTime = `${new Date().toISOString().split('T')[0]} ${time}`;
    setLogs(prev => [
      { timestamp: fullTime, category, message },
      ...prev
    ]);
  };

  // =========================================================================
  // 8. USER ACTION HANDLERS (Simulates MERN Mutations)
  // =========================================================================

  /**
   * Performs authentication routing based on profile selection.
   * Pushes a history state to match browser popstate trackers.
   */
  const handleLogin = (selectedRole) => {
    let targetRole = 'login';
    
    if (selectedRole === 'management') {
      targetRole = 'management';
      setUsername('General Manager');
      logActivity('System', `Admin session initialized for 'General Manager'. Access granted.`);
    } else if (selectedRole === 'generator') {
      targetRole = 'generator';
      setUsername('Marriott Manager');
    } else if (selectedRole === 'installer') {
      targetRole = 'installer';
      setUsername('Lead Installer');
    } else if (selectedRole === 'collector') {
      targetRole = 'collector';
      setUsername('Driver E-04');
    } else if (selectedRole === 'composition') {
      targetRole = 'processor';
      setUsername('Yard Supervisor');
    }

    setRole(targetRole);
    window.history.pushState({ role: targetRole }, '');
  };

  /**
   * Resets active session and navigates back to gateway screen.
   */
  const handleBackToLogin = () => {
    setRole('login');
    window.history.pushState({ role: 'login' }, '');
  };

  /**
   * Triggers the crew-assignment flow for a pending bin request.
   */
  const handleApproveReq = (reqId) => {
    setPendingReqId(reqId);
    setShowTechModal(true);
  };

  /**
   * Finalizes request approval, registers crew, provisions smart bins, 
   * and appends new zones into the active agreements database.
   */
  const confirmApproveReq = (crew) => {
    const req = installRequests.find(r => r.id === pendingReqId);
    if (!req) return;

    // Transition request status
    setInstallRequests(prev => prev.map(r => 
      r.id === pendingReqId ? { ...r, status: 'Approved', assignedCrew: crew.name } : r
    ));

    // Update active bin inventory indicators
    setStats(prev => ({
      ...prev,
      activeBins: prev.activeBins + req.binsRequested
    }));

    // Insert new zone into Active Sites
    setActiveSites(prev => [
      ...prev,
      {
        id: `SITE-0${prev.length + 1}`,
        name: req.org,
        bins: req.binsRequested,
        sortAccuracy: 100.0,
        status: 'Compliant'
      }
    ]);

    logActivity('System', `APPROVED smart bin installation for ${req.org}. Technician crew '${crew.name}' (Lead: ${crew.lead}) dispatched.`);
    setShowTechModal(false);
    setPendingReqId(null);
  };

  /**
   * Rejects an installation request.
   */
  const handleDenyReq = (reqId) => {
    const req = installRequests.find(r => r.id === reqId);
    if (!req) return;

    setInstallRequests(prev => prev.map(r => 
      r.id === reqId ? { ...r, status: 'Denied' } : r
    ));

    logActivity('System', `DECLINED installation request for ${req.org} after local area survey.`);
  };

  /**
   * Triggers the carrier-assignment flow for collected organic waste.
   */
  const handleAssignLogistics = (wasteId) => {
    setPendingWasteId(wasteId);
    setShowLogisticsModal(true);
  };

  /**
   * Finalizes carrier assignment, updates diverted weights, 
   * estimates pending carbon offsets, and calculates compost product sales values.
   */
  const confirmAssignLogistics = (partner) => {
    const waste = collectedWasteQueue.find(w => w.id === pendingWasteId);
    if (!waste) return;

    // Discard from hauling queue
    setCollectedWasteQueue(prev => prev.filter(w => w.id !== pendingWasteId));

    // Increment recycling metrics and revenue
    setStats(prev => ({
      ...prev,
      totalWasteDivertedKg: prev.totalWasteDivertedKg + waste.weightKg,
      pendingCarbonCreditsMt: parseFloat((prev.pendingCarbonCreditsMt + (waste.weightKg * 0.000912)).toFixed(3)),
      compostRevenueUsd: prev.compostRevenueUsd + Math.round(waste.weightKg * 0.15)
    }));

    logActivity('Logistics', `Dispatched logistics partner '${partner.name}' (Contact: ${partner.contact}) to haul ${waste.weightKg}kg organic waste from ${waste.site} to Composting Plant.`);
    setShowLogisticsModal(false);
    setPendingWasteId(null);
  };

  /**
   * Certifies soil-tested compost batches, moving estimated credits 
   * into the verified environmental registry ledger.
   */
  const handleCertifyCarbon = (batchId) => {
    const batch = batchesAwaitingCert.find(b => b.id === batchId);
    if (!batch) return;

    // Discard from verification queue
    setBatchesAwaitingCert(prev => prev.filter(b => b.id !== batchId));

    // Mint credits and unlock registry token value
    setStats(prev => ({
      ...prev,
      pendingCarbonCreditsMt: parseFloat(Math.max(0, prev.pendingCarbonCreditsMt - batch.carbonOffsetValueMt).toFixed(3)),
      certifiedCarbonCreditsMt: parseFloat((prev.certifiedCarbonCreditsMt + batch.carbonOffsetValueMt).toFixed(3)),
      compostRevenueUsd: prev.compostRevenueUsd + Math.round(batch.carbonOffsetValueMt * 400)
    }));

    logActivity('Audit', `Carbon Credits Certified: Minted ${batch.carbonOffsetValueMt} MT CO2e for batch '${batch.name}' into Gold Standard Environmental Registry.`);
  };

  // =========================================================================
  // 9. DYNAMIC ROUTING RENDER PATTERNS (SPA CONTROLLER)
  // =========================================================================
  switch (role) {
    case 'login':
      return <LoginGate onLogin={handleLogin} />;
    
    case 'management':
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
    
    // Developer Hooks: Placeholders for client-facing dashboards
    case 'generator':
      return <UserDashboard onLogout={handleBackToLogin} />;
    
    case 'installer':
      return <TechnicianDashboard onLogout={handleBackToLogin} />;
    
    case 'logistics':
      return <LogisticsDashboard onLogout={handleBackToLogin} />;
    
    case 'processor':
      return <CompostOperatorDashboard onLogout={handleBackToLogin} />;
    
    case 'qa':
      return <QALabDashboard onLogout={handleBackToLogin} />;
    
    case 'buyer':
      return <MarketplaceDashboard onLogout={handleBackToLogin} />;
    
    default:
      return <LoginGate onLogin={handleLogin} />;
  }
}
