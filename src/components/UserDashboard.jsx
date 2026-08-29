import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  IconBrandLogo, IconPlus, IconBox, IconUser, IconBell
} from './Icons';
import { api } from '../api';
import DashboardAssistant from './DashboardAssistant';
import RequestProgressTracker from './RequestProgressTracker';

const clientMapPinIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#047857;border:2px solid #FFFFFF;box-shadow:0 4px 10px rgba(4,120,87,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:900;">•</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapLocationSelector({ coords, onCoordsChange }) {
  const map = useMapEvents({
    click(e) {
      onCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], map.getZoom());
  }, [coords.lat, coords.lng, map]);

  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={clientMapPinIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onCoordsChange({ lat: pos.lat, lng: pos.lng });
        }
      }}
    >
      <Popup>
        <div style={{ fontWeight: 800, color: '#0F172A' }}>Selected Placement Location</div>
        <div style={{ fontSize: '11px', color: '#64748B' }}>
          Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
        </div>
      </Popup>
    </Marker>
  );
}

export default function UserDashboard({ username, userData, onLogout }) {
  // 3 Essential Navigation Tabs Requested by User: 'request_bin', 'my_requests', 'assigned_tech_contacts'
  const [activeTab, setActiveTab] = useState('request_bin');

  // Backend Requests State
  const [realRequests, setRealRequests] = useState([]);
  const [collectionRequests, setCollectionRequests] = useState([]);
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

  const loadCollectionRequests = async () => {
    try {
      const res = await api.requests.getMyCollection();
      const requests = res?.requests || JSON.parse(localStorage.getItem('greengold_collection_requests') || '[]');
      setCollectionRequests(prev => JSON.stringify(prev) !== JSON.stringify(requests) ? requests : prev);
    } catch (err) {
      const fallback = JSON.parse(localStorage.getItem('greengold_collection_requests') || '[]');
      setCollectionRequests(prev => JSON.stringify(prev) !== JSON.stringify(fallback) ? fallback : prev);
    }
  };

  useEffect(() => {
    loadRequests();
    loadCollectionRequests();
    const timer = setInterval(() => {
      loadRequests();
      loadCollectionRequests();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // User Information
  const displayName = userData?.organizationName || userData?.fullName || username || 'Customer Portal';
  const userCity = userData?.city || 'Islamabad';
  const userPhone = userData?.phone || '+92 300 1234567';

  // Smart Bin Request Form State with Map Location
  const [selectedCoords, setSelectedCoords] = useState({ lat: 33.7206, lng: 73.1070 }); // Default Serena Hotel Islamabad
  const [binRequestForm, setBinRequestForm] = useState({
    locationName: 'G-5',
    category: 'Commercial / Hotel / Retail',
    contactNumber: userPhone,
    fullAddress: 'Club Road, Sector G-5/1, Islamabad',
    binsNeeded: '1',
    binCategory: 'IoT Ultrasonic Smart Bin (240L)',
    specialInstructions: ''
  });

  const LOCATION_PRESETS = [
    {
      name: 'Serena Hotel Islamabad (Sector G-5)',
      town: 'G-5',
      address: 'Club Road, Sector G-5/1, Islamabad',
      lat: 33.7206,
      lng: 73.1070
    },
    {
      name: 'Bahria Town Phase 7 (Rawalpindi)',
      town: 'Phase 7',
      address: 'Corniche Road, River View Commercial, Bahria Town Phase 7, Rawalpindi',
      lat: 33.5255,
      lng: 73.1098
    },
    {
      name: 'PAF Complex Sector E-9 (Islamabad)',
      town: 'E-9',
      address: 'PAF Complex, Margalla Road, Sector E-9, Islamabad',
      lat: 33.7145,
      lng: 73.0238
    },
    {
      name: 'NUST H-12 Campus (Islamabad)',
      town: 'H-12',
      address: 'NUST Main Campus, Gate 4, Sector H-12, Islamabad',
      lat: 33.6425,
      lng: 72.9904
    },
    {
      name: 'Beverly Centre Blue Area (Islamabad)',
      town: 'Blue Area',
      address: 'Beverly Centre, 56-G, Jinnah Avenue, Blue Area, Islamabad',
      lat: 33.7167,
      lng: 73.0673
    }
  ];

  const handleApplyPreset = (preset) => {
    setSelectedCoords({ lat: preset.lat, lng: preset.lng });
    setBinRequestForm(prev => ({
      ...prev,
      locationName: preset.town,
      fullAddress: preset.address
    }));
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    site: '',
    wasteType: 'Food Waste',
    weightKg: '120',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    setCollectionSubmitting(true);

    try {
      const payload = {
        site: collectionForm.site.trim(),
        wasteType: collectionForm.wasteType.trim(),
        weightKg: Number(collectionForm.weightKg),
        notes: collectionForm.notes.trim(),
        collectedDate: new Date().toISOString()
      };

      if (!payload.site || !payload.wasteType || !payload.weightKg || payload.weightKg <= 0) {
        throw new Error('Site, waste type, and valid weight are required.');
      }

      const response = await api.requests.createCollection(payload);
      const stored = JSON.parse(localStorage.getItem('greengold_collection_requests') || '[]');
      const next = [{
        id: response.request?._id || `COLL-${Date.now()}`,
        site: payload.site,
        wasteType: payload.wasteType,
        weightKg: payload.weightKg,
        collectedDate: new Date().toISOString().slice(0, 10),
        status: 'Awaiting Partner',
        assignedPartner: null,
        notes: payload.notes
      }, ...stored];
      localStorage.setItem('greengold_collection_requests', JSON.stringify(next));

      setCollectionForm({ site: '', wasteType: 'Food Waste', weightKg: '120', notes: '' });
      setShowCollectionModal(false);
      setShowSuccessModal(true);
      setActiveTab('my_requests');
      await loadRequests();
    } catch (err) {
      alert(`Waste Collection Request Failed: ${err.message}`);
    } finally {
      setCollectionSubmitting(false);
    }
  };

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
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
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

  const combinedRequestHistory = [
    ...realRequests.map(req => ({ ...req, requestKind: 'BIN' })),
    ...collectionRequests.map(req => ({
      ...req,
      requestKind: 'COLLECTION',
      requestNumber: req.requestNumber || req.id || req._id || 'COLL-NEW',
      town: req.town || req.site || 'Site',
      city: req.city || userCity,
      address: req.address || req.site || 'Pending site details',
      status: req.status || 'Awaiting Partner'
    }))
  ];

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

      {showCollectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Request Waste Collection</h3>
            <form onSubmit={handleCollectionSubmit}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label htmlFor="collection-site" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Site Name</label>
                  <input id="collection-site" value={collectionForm.site} onChange={(e) => setCollectionForm({ ...collectionForm, site: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="e.g. North Ridge Apartments" />
                </div>
                <div>
                  <label htmlFor="collection-type" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Waste Type</label>
                  <input id="collection-type" value={collectionForm.wasteType} onChange={(e) => setCollectionForm({ ...collectionForm, wasteType: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="collection-weight" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Estimated Weight</label>
                  <input id="collection-weight" type="number" min="1" value={collectionForm.weightKg} onChange={(e) => setCollectionForm({ ...collectionForm, weightKg: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="collection-notes" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Notes</label>
                  <textarea id="collection-notes" value={collectionForm.notes} onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', resize: 'vertical' }} placeholder="Optional access details" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-eco-secondary" onClick={() => setShowCollectionModal(false)} style={{ padding: '10px 16px' }}>Cancel</button>
                <button type="submit" className="login-btn" disabled={collectionSubmitting} style={{ width: 'auto', padding: '10px 16px' }}>{collectionSubmitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXECUTIVE DARK SIDEBAR */}
      <aside className="sidebar-left" style={{ width: '280px', background: '#0B2822', color: '#FFFFFF', padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '0 8px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
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
              onClick={() => setShowCollectionModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.5)', cursor: 'pointer', textAlign: 'left',
                background: '#064E3B', color: '#ECFDF5', transition: 'all 0.2s ease'
              }}
            >
              <IconPlus size={20} />
              Request Waste Collection
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
              {(realRequests.length + collectionRequests.length) > 0 && (
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                  {realRequests.length + collectionRequests.length}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn-eco-secondary"
                onClick={() => setShowCollectionModal(true)}
                style={{ width: 'auto', height: '42px', justifyContent: 'center', borderRadius: '12px' }}
              >
                Request Waste Collection
              </button>
            </div>

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
                  rows="2"
                  placeholder="Enter precise street address, building block, or loading bay instructions..."
                  value={binRequestForm.fullAddress}
                  onChange={(e) => setBinRequestForm({ ...binRequestForm, fullAddress: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                />
              </div>

              {/* =========================================================================
                  INTERACTIVE MAP LOCATION PICKER & QUICK PRESETS
                  ========================================================================= */}
              <div style={{ marginBottom: '24px', background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Pinpoint Precise Site Location on Map
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Click on map or drag pin to set exact coordinates for installation & collection crew.
                    </span>
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#065F46' }}>
                    GPS: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                  </div>
                </div>

                {/* Quick Presets Buttons */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                    Quick Landmark Presets:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {LOCATION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        style={{
                          background: selectedCoords.lat === preset.lat ? '#10B981' : '#FFFFFF',
                          color: selectedCoords.lat === preset.lat ? '#FFFFFF' : '#1E293B',
                          border: '1px solid #CBD5E1',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Leaflet Map Container */}
                <div style={{ height: '240px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                  <MapContainer
                    center={[selectedCoords.lat, selectedCoords.lng]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapLocationSelector coords={selectedCoords} onCoordsChange={setSelectedCoords} />
                  </MapContainer>
                </div>
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
                  {combinedRequestHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                        No deployment requests submitted yet. Click <strong>"Request Smart Bin"</strong> or <strong>"Request Waste Collection"</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    combinedRequestHistory.map(req => (
                      <tr key={`${req.requestKind}-${req._id || req.requestNumber || req.id}`}>
                        <td><strong>{req.requestNumber || req.id || req._id || 'N/A'}</strong></td>
                        <td>{req.town || req.site || 'Pending'}, {req.city || userCity}</td>
                        <td><strong>{req.numberOfBins || req.weightKg || 1} {req.requestKind === 'COLLECTION' ? 'kg' : 'Bins'}</strong></td>
                        <td>{req.address || req.site || 'Pending site details'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                            <span 
                              style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800',
                                background: req.status === 'APPROVED' || req.status === 'ASSIGNED' || req.status === 'WAITING_COLLECTION' ? '#ECFDF5' : req.status === 'DECLINED' ? '#FEE2E2' : '#EFF6FF',
                                color: req.status === 'APPROVED' || req.status === 'ASSIGNED' || req.status === 'WAITING_COLLECTION' ? '#047857' : req.status === 'DECLINED' ? '#991B1B' : '#1E40AF',
                                border: `1px solid ${req.status === 'APPROVED' || req.status === 'ASSIGNED' || req.status === 'WAITING_COLLECTION' ? '#6EE7B7' : req.status === 'DECLINED' ? '#FCA5A5' : '#BFDBFE'}`
                              }}
                            >
                              {req.status || 'Awaiting Partner'}
                            </span>
                            <RequestProgressTracker
                              status={req.status || 'REQUESTED'}
                              variant="customer"
                              compact={true}
                              label="Request status"
                            />
                          </div>
                          {req.declineReason && (
                            <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: '600' }}>
                              Decline Reason: "{req.declineReason}"
                            </div>
                          )}
                        </td>
                        <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : req.collectedDate || 'Today'}</td>
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
      <DashboardAssistant dashboardName="user" accent="#10B981" />
    </div>
  );
}