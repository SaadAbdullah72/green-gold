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
import GreenGoldLogo from './GreenGoldLogo';

const clientMapPinIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(4,120,87,0.25);"></div><div style="width:16px;height:16px;border-radius:50%;background:#047857;border:3px solid #FFFFFF;box-shadow:0 3px 10px rgba(0,0,0,0.3);position:relative;z-index:2;"></div></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapLocationSelector({ coords, onCoordsChange, onLocationSelected }) {
  const map = useMapEvents({
    click(e) {
      const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      onCoordsChange(newCoords);
      if (onLocationSelected) onLocationSelected(newCoords.lat, newCoords.lng);
    }
  });

  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], map.getZoom(), { duration: 1.2 });
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
          const newCoords = { lat: pos.lat, lng: pos.lng };
          onCoordsChange(newCoords);
          if (onLocationSelected) onLocationSelected(newCoords.lat, newCoords.lng);
        }
      }}
    >
      <Popup>
        <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'Times New Roman, serif' }}>Selected Smart Bin Placement Site</div>
        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Times New Roman, serif' }}>
          GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
      </Popup>
    </Marker>
  );
}

export default function UserDashboard({ username, userData, onLogout }) {
  // 3 Essential Navigation Tabs Requested by User: 'request_bin', 'my_requests', 'assigned_tech_contacts'
  // 4 Navigation Tabs: 'request_bin', 'my_requests', 'waste_lifecycle', 'assigned_tech_contacts'
  const [activeTab, setActiveTab] = useState('request_bin');

  // Backend Requests State
  const [realRequests, setRealRequests] = useState([]);
  const [collectionRequests, setCollectionRequests] = useState([]);
  const [myDumpRecords, setMyDumpRecords] = useState([]);
  const [myRecyclingReports, setMyRecyclingReports] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteMyAccount = async () => {
    const confirmDelete = window.confirm(
      '⚠️ PERMANENT ACCOUNT DELETION\n\nAre you sure you want to permanently delete your account?\n\nThis will permanently delete:\n• Your account and login credentials\n• All submitted smart bin requests\n• All waste pickup requests\n• All linked dump logs & carbon credits\n\nThis action CANNOT be undone.'
    );
    if (!confirmDelete) return;

    try {
      setIsDeletingAccount(true);
      await api.auth.deleteAccount();
      alert('Your account and all associated facility records have been permanently deleted.');
      if (onLogout) onLogout();
      else window.location.reload();
    } catch (err) {
      alert(`Deletion Error: ${err.message}`);
      setIsDeletingAccount(false);
    }
  };

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

  const loadWasteLifecycle = async () => {
    try {
      const [dumpRes, reportRes] = await Promise.allSettled([
        api.management.getDumpRecords(),
        api.management.getAllRecyclingReports()
      ]);
      if (dumpRes.status === 'fulfilled' && dumpRes.value.records) {
        setMyDumpRecords(dumpRes.value.records);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value.reports) {
        setMyRecyclingReports(reportRes.value.reports);
      }
    } catch (err) {
      // silent catch
    }
  };

  useEffect(() => {
    loadRequests();
    loadCollectionRequests();
    loadWasteLifecycle();
    const timer = setInterval(() => {
      loadRequests();
      loadCollectionRequests();
      loadWasteLifecycle();
    }, 4000);
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

  // Dynamic Location Search & Reverse Geocode State (InDrive / Yango style)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const handleSearchPlaces = async (queryText) => {
    setSearchQuery(queryText);
    if (!queryText || queryText.trim().length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&countrycodes=pk&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
      setSearchDropdownOpen(true);
    } catch (err) {
      console.warn('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSelectedCoords({ lat, lng });

    const addr = item.address || {};
    const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.town || addr.city || '';
    const cleanAddress = item.display_name ? item.display_name.split(',').slice(0, 4).join(',').trim() : item.display_name;

    setBinRequestForm(prev => ({
      ...prev,
      locationName: suburb || prev.locationName,
      fullAddress: cleanAddress || prev.fullAddress
    }));

    setSearchQuery(cleanAddress);
    setSearchDropdownOpen(false);
  };

  const reverseGeocodeCoords = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.town || addr.city || '';
        const cleanAddress = data.display_name ? data.display_name.split(',').slice(0, 4).join(',').trim() : data.display_name;

        setBinRequestForm(prev => ({
          ...prev,
          locationName: suburb || prev.locationName,
          fullAddress: cleanAddress || prev.fullAddress
        }));
        setSearchQuery(cleanAddress);
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDetectCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          reverseGeocodeCoords(lat, lng);
        },
        (err) => {
          alert('Device location unavailable. You can search any location by typing in the search box or dragging the map pin.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
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
          <div style={{ marginBottom: '32px', padding: '0 4px' }}>
            <GreenGoldLogo size={58} subtitle="Waste Generator Portal" />
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
              onClick={() => setActiveTab('waste_lifecycle')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: activeTab === 'waste_lifecycle' ? '#10B981' : 'transparent',
                color: activeTab === 'waste_lifecycle' ? '#FFFFFF' : '#A7F3D0',
                transition: 'all 0.2s ease'
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Waste & Carbon Credits
              {myDumpRecords.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#34D399', color: '#064E3B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                  {myDumpRecords.length}
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

        {/* User Profile Card & Actions */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              {displayName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#34D399' }}>{userCity} • {userData?.email || ''}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={onLogout}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#A7F3D0', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}
            >
              Sign Out »
            </button>

            <button
              type="button"
              onClick={handleDeleteMyAccount}
              disabled={isDeletingAccount}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #F87171',
                background: '#7F1D1D',
                color: '#FECACA',
                fontSize: '11px',
                fontWeight: '800',
                cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              title="Permanently delete your account and all associated requests"
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Delete My Account'}
            </button>
          </div>
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
                  INDRIVE / YANGO STYLE INTERACTIVE SEARCH & PRECISE MAP PINPOINT
                  ========================================================================= */}
              <div style={{ marginBottom: '24px', background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Location Pinpoint & Area Search
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Type any place/area in Pakistan below or drag the pin directly on the map (like InDrive/Yango).
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isGeocoding && (
                      <span style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>
                        Updating address...
                      </span>
                    )}
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#065F46' }}>
                      GPS: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                    </div>
                  </div>
                </div>

                {/* InDrive / Yango Search Bar with Auto-Complete Dropdown */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        className="modern-input"
                        placeholder="Search any sector, landmark, or street (e.g. Serena Hotel, Centaurus, F-6 Markaz, Bahria Town)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchPlaces(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setSearchDropdownOpen(true); }}
                        style={{
                          width: '100%',
                          height: '46px',
                          paddingLeft: '38px',
                          paddingRight: '36px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      />
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                      {isSearching && (
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#047857', fontWeight: '700' }}>
                          Searching...
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#047857',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title="Use device GPS"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                      Locate Me
                    </button>
                  </div>

                  {/* Auto-complete suggestions dropdown */}
                  {searchDropdownOpen && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '52px',
                      left: 0,
                      right: 0,
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      {searchResults.map((item, sIdx) => {
                        const title = item.name || item.display_name.split(',')[0];
                        const subtitle = item.display_name.split(',').slice(1, 4).join(',').trim();

                        return (
                          <div
                            key={sIdx}
                            onClick={() => handleSelectSearchResult(item)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: sIdx === searchResults.length - 1 ? 'none' : '1px solid #F1F5F9',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                              {title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {subtitle}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Interactive Leaflet Map Container with Drag Pin & Reverse Geocode */}
                <div style={{ height: '260px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
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
                    <MapLocationSelector
                      coords={selectedCoords}
                      onCoordsChange={setSelectedCoords}
                      onLocationSelected={(lat, lng) => reverseGeocodeCoords(lat, lng)}
                    />
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
            TAB 2.5: WASTE LIFECYCLE, MULTI-STAKEHOLDER PIPELINE & CARBON CREDITS
            ========================================================================= */}
        {activeTab === 'waste_lifecycle' && (() => {
          const userOrg = (userData?.organizationName || userData?.fullName || username || '').toLowerCase();
          const filteredDumps = myDumpRecords.length > 0
            ? myDumpRecords.filter(d => {
                if (d.userId && String(d.userId) === String(userData?._id || userData?.id)) return true;
                if (d.organizationName && userOrg && d.organizationName.toLowerCase().includes(userOrg)) return true;
                return true; // show demo dumps
              })
            : [];

          const totalDumped = filteredDumps.reduce((sum, d) => sum + (d.weightKg || 0), 0);
          
          // Match contributions from recycling reports
          let userRecycledKg = 0;
          let userCarbonCredits = 0;

          myRecyclingReports.forEach(r => {
            if (r.userContributions && Array.isArray(r.userContributions)) {
              r.userContributions.forEach(uc => {
                userRecycledKg += (uc.recycledKg || 0);
                userCarbonCredits += (uc.carbonCreditsEarned || 0);
              });
            }
          });

          // If reports haven't processed all yet, compute live preview
          if (userCarbonCredits === 0 && totalDumped > 0) {
            const processedDumps = filteredDumps.filter(d => d.status === 'PROCESSED');
            if (processedDumps.length > 0) {
              const pKg = processedDumps.reduce((s, d) => s + (d.weightKg || 0), 0);
              userRecycledKg = Number((pKg * 0.85).toFixed(1));
              userCarbonCredits = Number((userRecycledKg * 0.5).toFixed(2));
            }
          }

          return (
            <div>
              
              {/* Top KPI Cards for Carbon Offsets & Recovery */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Total Waste Collected</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>
                    {totalDumped.toFixed(1)} <span style={{ fontSize: '13px' }}>KG</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{filteredDumps.length} collection cycles completed</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Certified Recycled</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                    {userRecycledKg.toFixed(1)} <span style={{ fontSize: '13px' }}>KG</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Diverted from municipal landfills</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Carbon Credits Earned</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                    +{userCarbonCredits.toFixed(2)} <span style={{ fontSize: '13px' }}>CC</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Audited by certified recycling plants</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Diversion Efficiency</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284C7', marginTop: '4px' }}>
                    {totalDumped > 0 ? ((userRecycledKg / totalDumped) * 100).toFixed(0) : 85}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Circular economy index</div>
                </div>
              </div>

              {/* Multi-Stakeholder Pipeline Explanation Banner */}
              <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)', color: '#FFFFFF', padding: '22px 26px', borderRadius: '18px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(6,78,59,0.15)' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6EE7B7', fontWeight: '800' }}>
                  CERTIFIED MULTI-STAKEHOLDER SUPPLY CHAIN
                </div>
                <h3 style={{ margin: '4px 0 10px', fontSize: '19px', fontWeight: '800' }}>
                  How Your Waste Generates Verified Carbon Credits
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', fontSize: '12px', marginTop: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <strong style={{ color: '#34D399', display: 'block', fontSize: '13px', marginBottom: '2px' }}>1. Smart Collector</strong>
                    Picks up full bin & dumps batch at Central Yard.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <strong style={{ color: '#38BDF8', display: 'block', fontSize: '13px', marginBottom: '2px' }}>2. Stream Separation</strong>
                    Admin classifies batch into Organic, Plastic, or Metal.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <strong style={{ color: '#FCD34D', display: 'block', fontSize: '13px', marginBottom: '2px' }}>3. Transporter Haul</strong>
                    Transporter moves cargo from Yard to specialized plant.
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <strong style={{ color: '#4ADE80', display: 'block', fontSize: '13px', marginBottom: '2px' }}>4. Factory Audit & CC</strong>
                    Plant enters actual yield & mints your Carbon Credits!
                  </div>
                </div>
              </div>

              {/* Detailed Batches & Lifecycle Audit Table */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  Waste Pickups & Carbon Verification History ({filteredDumps.length})
                </h3>

                {filteredDumps.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                    No collection batches recorded for your facility yet. When a waste collector empties your smart bins, your lifecycle records and carbon offset certificates will appear here automatically.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B', textTransform: 'uppercase', fontSize: '11px' }}>
                          <th style={{ padding: '12px' }}>Collection Date</th>
                          <th style={{ padding: '12px' }}>Bin ID / Site</th>
                          <th style={{ padding: '12px' }}>Gross Dumped</th>
                          <th style={{ padding: '12px' }}>Waste Stream</th>
                          <th style={{ padding: '12px' }}>Collector</th>
                          <th style={{ padding: '12px' }}>Lifecycle Stage</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Carbon Credits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDumps.map((rec, idx) => {
                          const estRecycled = Number((rec.weightKg * 0.85).toFixed(1));
                          const ccEarned = (rec.status === 'PROCESSED') 
                            ? Number((estRecycled * (rec.wasteType === 'Plastic' ? 1.2 : rec.wasteType === 'Metal' ? 2.0 : 0.5)).toFixed(2))
                            : 0;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '12px', color: '#64748B' }}>
                                {rec.dumpedAt ? new Date(rec.dumpedAt).toLocaleDateString() : 'Recent'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <strong style={{ color: '#0F172A' }}>{rec.binId || 'BIN-01-01'}</strong>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>{rec.address}</div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '800', color: '#0F172A' }}>
                                {rec.weightKg} KG
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: rec.wasteType === 'Plastic' ? '#EFF6FF' : rec.wasteType === 'Metal' ? '#F3E8FF' : '#ECFDF5',
                                  color: rec.wasteType === 'Plastic' ? '#1E40AF' : rec.wasteType === 'Metal' ? '#6B21A8' : '#065F46'
                                }}>
                                  {rec.wasteType}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#475569' }}>
                                {rec.collectorName || 'Collector Driver C-101'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  background: rec.status === 'PROCESSED' ? '#D1FAE5' : rec.status === 'SEPARATED' ? '#E0F2FE' : rec.status === 'IN_TRANSIT' ? '#FEF3C7' : '#F1F5F9',
                                  color: rec.status === 'PROCESSED' ? '#065F46' : rec.status === 'SEPARATED' ? '#0369A1' : rec.status === 'IN_TRANSIT' ? '#92400E' : '#475569'
                                }}>
                                  {rec.status === 'DUMPED' && 'At Central Dump Yard'}
                                  {rec.status === 'SEPARATED' && 'Classified Stream'}
                                  {rec.status === 'ASSIGNED_TRANSPORT' && 'Assigned Transporter'}
                                  {rec.status === 'IN_TRANSIT' && 'In Transit to Plant 🚚'}
                                  {rec.status === 'DELIVERED' && 'At Recycling Plant Gate'}
                                  {rec.status === 'PROCESSED' && '✓ Recycled & Minted'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {rec.status === 'PROCESSED' ? (
                                  <strong style={{ color: '#059669', fontSize: '14px' }}>
                                    +{ccEarned} CC
                                  </strong>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                    Pending Audit
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

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