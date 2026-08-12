import React, { useState, useEffect } from 'react';
import {
  IconBrandLogo, IconPlus, IconBox, IconUser, IconBell
} from './Icons';
import { api } from '../api';

export default function UserDashboard({ username, userData, onLogout }) {
  // 3 Essential Navigation Tabs Requested by User: 'request_bin', 'my_requests', 'assigned_tech_contacts'
  const [activeTab, setActiveTab] = useState('request_bin');

  // Backend Requests State
  const [realRequests, setRealRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadRequests = async () => {
    try {
      const res = await api.requests.getMy();
      if (res.requests) {
        setRealRequests(prev => JSON.stringify(prev) !== JSON.stringify(res.requests) ? res.requests : prev);
      }
    } catch (err) {
      // silent catch for background polling
    }
  };

  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 8000);
    return () => clearInterval(timer);
  }, []);

  // User Information
  const displayName = userData?.organizationName || userData?.fullName || username || 'Customer Portal';
  const userCity = userData?.city || 'Islamabad';
  const userPhone = userData?.phone || '+92 300 1234567';

  // Smart Bin Request Form State
  const [binRequestForm, setBinRequestForm] = useState({
    locationName: '',
    category: 'Commercial / Hotel / Retail',
    contactNumber: userPhone,
    fullAddress: '',
    binsNeeded: '1',
    binCategory: 'IoT Ultrasonic Smart Bin (240L)',
    specialInstructions: ''
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleBinRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.requests.create({
        organizationName: displayName,
        contactPerson: displayName,
        phone: binRequestForm.contactNumber || userPhone,
        email: userData?.email || 'customer@greengold.org',
        address: binRequestForm.fullAddress || 'Sector F-7/2, Islamabad',
        town: binRequestForm.locationName || 'F-7',
        city: userCity || 'Islamabad',
        latitude: 33.7294,
        longitude: 73.0551,
        numberOfBins: parseInt(binRequestForm.binsNeeded, 10) || 1,
        binType: binRequestForm.binCategory || 'IoT Ultrasonic Smart Bin (240L)',
        specialInstructions: binRequestForm.specialInstructions,
        priority: 'Standard'
      });

      setShowSuccessModal(true);
      setBinRequestForm({
        locationName: '',
        category: 'Commercial / Hotel / Retail',
        contactNumber: userPhone,
        fullAddress: '',
        binsNeeded: '1',
        binCategory: 'IoT Ultrasonic Smart Bin (240L)',
        specialInstructions: ''
      });
      await loadRequests();
      setActiveTab('my_requests');
    } catch (err) {
      alert(`Request Submission Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Collect assigned technical workers across all requests
  const assignedTechnicalStaffList = [];
  realRequests.forEach(req => {
    if (req.assignedWorkers && req.assignedWorkers.length > 0) {
      req.assignedWorkers.forEach(w => {
        if (!assignedTechnicalStaffList.some(item => item._id === w._id)) {
          assignedTechnicalStaffList.push({
            ...w,
            requestNumber: req.requestNumber,
            town: req.town
          });
        }
      });
    }
  });

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAF6', fontFamily: 'var(--font-body)' }}>
      
      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="soft-card" style={{ maxWidth: '460px', width: '100%', padding: '32px', background: '#FFFFFF', borderRadius: '20px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #10B981', color: '#047857', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Request Submitted!
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '24px' }}>
              Your smart bin allotment request has been sent to Operations Management. You can track progress in <strong>My Requests & Status</strong>.
            </p>
            <button
              type="button"
              className="btn-eco-primary"
              onClick={() => setShowSuccessModal(false)}
              style={{ width: '100%', height: '44px', justifyContent: 'center', fontWeight: '700' }}
            >
              Continue to My Requests »
            </button>
          </div>
        </div>
      )}

      {/* EXECUTIVE DARK SIDEBAR */}
      <aside className="sidebar-left" style={{ width: '280px', background: '#0B2822', color: '#FFFFFF', padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '0 8px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                GreenGold OS
              </h2>
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Customer Portal
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', padding: '0 8px' }}>
            Smart Bin Deployment
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('request_bin')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'request_bin' ? '#10B981' : 'transparent',
                color: activeTab === 'request_bin' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <IconPlus size={20} />
              Request Smart Bin
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my_requests')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'my_requests' ? '#10B981' : 'transparent',
                color: activeTab === 'my_requests' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <IconBox size={20} />
              My Requests & Status
              {realRequests.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                  {realRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assigned_tech_contacts')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'assigned_tech_contacts' ? '#10B981' : 'transparent',
                color: activeTab === 'assigned_tech_contacts' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <IconUser size={20} />
              Technical Team Contacts
              {assignedTechnicalStaffList.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#34D399', color: '#064E3B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                  {assignedTechnicalStaffList.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User Profile Card & Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              {displayName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#34D399' }}>{userCity}</div>
            </div>
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
      <main className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              {activeTab === 'request_bin' && 'Request Smart Bin Allotment'}
              {activeTab === 'my_requests' && 'My Submitted Deployment Requests'}
              {activeTab === 'assigned_tech_contacts' && 'Assigned Technical Workforce Team Contacts'}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
              {activeTab === 'request_bin' && 'Submit IoT-enabled smart bin deployment request for your facility.'}
              {activeTab === 'my_requests' && 'Track live deployment status, pending approvals, and management feedback.'}
              {activeTab === 'assigned_tech_contacts' && 'Direct phone contact details (Primary & Secondary lines) for your assigned technical crew.'}
            </p>
          </div>
        </header>

        {/* =========================================================================
            TAB 1: REQUEST SMART BIN ALLOTMENT FORM
            ========================================================================= */}
        {activeTab === 'request_bin' && (
          <div className="soft-card" style={{ maxWidth: '800px', padding: '36px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <form onSubmit={handleBinRequestSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Location / Town / Sector Name *
                  </label>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="e.g. Sector F-7, Main Commercial Plaza"
                    value={binRequestForm.locationName}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, locationName: e.target.value })}
                    required
                    style={{ width: '100%', height: '46px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Facility Category *
                  </label>
                  <select
                    className="modern-input"
                    value={binRequestForm.category}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, category: e.target.value })}
                    style={{ width: '100%', height: '46px' }}
                  >
                    <option value="Commercial / Hotel / Retail">Commercial / Hotel / Retail</option>
                    <option value="Residential Society / Community">Residential Society / Community</option>
                    <option value="Industrial / Food Processing Plant">Industrial / Food Processing Plant</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    className="modern-input"
                    value={binRequestForm.contactNumber}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, contactNumber: e.target.value })}
                    required
                    style={{ width: '100%', height: '46px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Bins Quantity Needed *
                  </label>
                  <select
                    className="modern-input"
                    value={binRequestForm.binsNeeded}
                    onChange={(e) => setBinRequestForm({ ...binRequestForm, binsNeeded: e.target.value })}
                    style={{ width: '100%', height: '46px' }}
                  >
                    <option value="1">1 Unit (240L Smart Bin)</option>
                    <option value="2">2 Units (240L Smart Bins)</option>
                    <option value="3">3 Units (240L Smart Bins)</option>
                    <option value="4">4 Units (240L Smart Bins)</option>
                    <option value="5">5+ Bulk Units</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Placement Street Address *
                </label>
                <textarea
                  className="modern-input"
                  rows="3"
                  placeholder="Enter precise street address, building block, or loading bay instructions..."
                  value={binRequestForm.fullAddress}
                  onChange={(e) => setBinRequestForm({ ...binRequestForm, fullAddress: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Deployment Notes (Optional)
                </label>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="e.g. Gate 2 access required for vehicle installation crew."
                  value={binRequestForm.specialInstructions}
                  onChange={(e) => setBinRequestForm({ ...binRequestForm, specialInstructions: e.target.value })}
                  style={{ width: '100%', height: '46px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-eco-primary"
                disabled={submitting}
                style={{ width: '100%', height: '50px', fontSize: '16px', fontWeight: '800', justifyContent: 'center', borderRadius: '12px' }}
              >
                {submitting ? 'Submitting Request...' : 'Submit Smart Bin Allotment Request »'}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MY REQUESTS & STATUS TABLE
            ========================================================================= */}
        {activeTab === 'my_requests' && (
          <div className="soft-card" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
              Submitted Deployment Requests History
            </h3>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Town / Location</th>
                    <th>Bins</th>
                    <th>Placement Address</th>
                    <th>Status</th>
                    <th>Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {realRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                        No deployment requests submitted yet. Click <strong>"Request Smart Bin"</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    realRequests.map(req => (
                      <tr key={req._id || req.requestNumber}>
                        <td><strong>{req.requestNumber}</strong></td>
                        <td>{req.town}, {req.city}</td>
                        <td><strong>{req.numberOfBins} Bins</strong></td>
                        <td>{req.address}</td>
                        <td>
                          <span 
                            style={{
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                              background: req.status === 'APPROVED' || req.status === 'ASSIGNED' ? '#ECFDF5' : req.status === 'DECLINED' ? '#FEE2E2' : '#EFF6FF',
                              color: req.status === 'APPROVED' || req.status === 'ASSIGNED' ? '#047857' : req.status === 'DECLINED' ? '#991B1B' : '#1E40AF',
                              border: `1px solid ${req.status === 'APPROVED' || req.status === 'ASSIGNED' ? '#6EE7B7' : req.status === 'DECLINED' ? '#FCA5A5' : '#BFDBFE'}`
                            }}
                          >
                            {req.status}
                          </span>
                          {req.declineReason && (
                            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: '600' }}>
                              Decline Reason: "{req.declineReason}"
                            </div>
                          )}
                        </td>
                        <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: ASSIGNED TECHNICAL TEAM CONTACTS (2 CONTACT NUMBERS MANDATORY)
            ========================================================================= */}
        {activeTab === 'assigned_tech_contacts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {assignedTechnicalStaffList.length === 0 ? (
              <div className="soft-card" style={{ gridColumn: '1 / -1', padding: '48px', background: '#FFFFFF', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <IconUser size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  No Technical Staff Assigned Yet
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0, maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Once management approves your bin request and assigns a technical installation crew, their primary and secondary contact phone numbers will appear here.
                </p>
              </div>
            ) : (
              assignedTechnicalStaffList.map(worker => (
                <div key={worker._id} className="soft-card" style={{ padding: '24px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #10B981', color: '#047857', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {worker.fullName?.substring(0, 2).toUpperCase() || 'TS'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        {worker.fullName}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                        ID: {worker.employeeId || 'T-100'} • {worker.department || 'Field Crew'}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                    {/* PRIMARY PHONE NUMBER */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        Primary Contact Number (Direct)
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                        {worker.phone || '+92 300 1002001'}
                      </div>
                    </div>

                    {/* SECONDARY EMERGENCY PHONE NUMBER */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        Secondary Emergency Line (Field Team)
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                        {worker.secondaryPhone || worker.phone || '+92 321 9998877'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href={`tel:${worker.phone}`}
                      className="btn-eco-primary"
                      style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}
                    >
                      Call Primary »
                    </a>
                    {worker.secondaryPhone && (
                      <a
                        href={`tel:${worker.secondaryPhone}`}
                        className="btn-eco-secondary"
                        style={{ flex: 1, padding: '10px', fontSize: '13px', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}
                      >
                        Call Secondary »
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}