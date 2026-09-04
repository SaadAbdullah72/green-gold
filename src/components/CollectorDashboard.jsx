import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import DashboardAssistant from './DashboardAssistant';
import RequestProgressTracker from './RequestProgressTracker';
import GreenGoldLogo from './GreenGoldLogo';

// Custom Collector Vehicle Icon
const collectorIcon = L.divIcon({
  className: 'custom-collector-icon',
  html: `
    <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; inset:0; border-radius:50%; background:rgba(16,185,129,0.3); animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:26px; height:26px; border-radius:50%; background:#059669; border:3px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(5,150,105,0.5); color:#FFFFFF; font-size:12px; font-weight:900;">
        🚛
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Custom Bin Pickup Location Icon
const createPickupIcon = (fillLevel = 90, isUrgent = true) => L.divIcon({
  className: 'custom-pickup-icon',
  html: `
    <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
      <div style="position:absolute; inset:0; border-radius:50%; background:${isUrgent ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:30px; height:30px; border-radius:50%; background:${isUrgent ? '#DC2626' : '#D97706'}; border:3px solid #FFFFFF; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(0,0,0,0.3); color:#FFFFFF;">
        <span style="font-size:10px; font-weight:900; line-height:1;">🗑️</span>
        <span style="font-size:8px; font-weight:900; line-height:1; margin-top:1px;">${fillLevel}%</span>
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Helper component to auto-fit bounds on map when locations or pickups change
function MapBoundsHandler({ collectorLocation, pickups, focusedTarget }) {
  const map = useMap();

  useEffect(() => {
    if (focusedTarget && focusedTarget.lat && focusedTarget.lng) {
      map.flyTo([focusedTarget.lat, focusedTarget.lng], 15, { duration: 1.2 });
      return;
    }

    const points = [];
    if (collectorLocation?.lat && collectorLocation?.lng) {
      points.push([collectorLocation.lat, collectorLocation.lng]);
    }
    (pickups || []).forEach(p => {
      if (p.lat && p.lng) {
        points.push([p.lat, p.lng]);
      }
    });

    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [collectorLocation, pickups, focusedTarget, map]);

  return null;
}

export default function CollectorDashboard({ onLogout }) {
  const { user } = useAuth();
  const collectorId = user?.id || 'COL-1001';

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: 33.6844, lng: 73.0479 });
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [focusedTarget, setFocusedTarget] = useState(null);

  const sortedPickups = useMemo(() => {
    if (!route?.pickups) return [];
    return [...route.pickups].sort((a, b) => (b.fillLevel || b.timeFullMinutes || 0) - (a.fillLevel || a.timeFullMinutes || 0));
  }, [route]);

  const resolveLocation = async () => {
    try {
      if (navigator.geolocation) {
        return await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve({ lat: 33.6844, lng: 73.0479 }),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }
    } catch (error) {
      console.warn('Location access unavailable:', error);
    }

    return { lat: 33.6844, lng: 73.0479 };
  };

  const loadRoute = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.collector.getMyAssignments();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      
      // Keep collector's real current location distinct from target pickup site
      const myCoords = await resolveLocation();
      setLocation(myCoords);
      setRoute({ collectorId, currentLocation: myCoords, pickups: jobs });
    } catch (error) {
      console.error('Route load failed:', error);
      if (!silent) setRoute({ collectorId, currentLocation: { lat: 33.6844, lng: 73.0479 }, pickups: [] });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRoute(false);
    const interval = setInterval(() => {
      loadRoute(true); // Silent background polling
    }, 4000);
    return () => clearInterval(interval);
  }, [collectorId]);

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      const coords = await resolveLocation();
      if (!mounted) return;
      setLocation(coords);
    };

    tick();
    const timer = setInterval(tick, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [collectorId]);

  const handleFlagContamination = async (pickup) => {
    const value = notes.trim() || `Flagged during collection: possible contamination at ${pickup.locationName}`;
    setMessage(value ? 'Contamination noted and reported to management.' : 'Contamination flagged');
    setRoute((prev) => ({
      ...prev,
      pickups: (prev?.pickups || []).map((item) => item.id === pickup.id ? { ...item, status: 'FLAGGED' } : item),
    }));
    setNotes('');
  };

  const handleAcceptAssignment = async (pickup) => {
    try {
      const targetId = pickup._id || pickup.assignmentId || pickup.id;
      const res = await api.collector.acceptAssignment(targetId);
      setMessage(res.message || 'Duty accepted! Moving to pickup site.');
      setRoute((prev) => ({
        ...prev,
        pickups: (prev?.pickups || []).map((item) => 
          (item._id || item.assignmentId || item.id) === targetId ? { ...item, status: 'IN_PROGRESS' } : item
        ),
      }));
      setFocusedTarget(pickup);
    } catch (error) {
      setMessage(error.message || 'Could not accept pickup duty');
    }
  };

  const handleCollect = async (pickup) => {
    try {
      const targetId = pickup._id || pickup.assignmentId || pickup.id;
      const result = await api.collector.completeAssignment(targetId);
      setMessage(result.message || 'Pickup marked as collected and task completed!');
      setRoute((prev) => ({
        ...prev,
        pickups: (prev?.pickups || []).filter((item) => (item._id || item.assignmentId || item.id) !== targetId),
      }));
      setFocusedTarget(null);
    } catch (error) {
      setMessage(error.message || 'Could not complete pickup');
    }
  };

  const handleProgressStageUpdate = async (pickup, nextStage) => {
    try {
      if (nextStage === 'ACCEPTED' || nextStage === 'IN_PROGRESS') {
        await handleAcceptAssignment(pickup);
        return;
      }

      if (nextStage === 'AT_SITE') {
        setMessage('Collector has reached the destination and is at the pickup location.');
        return;
      }

      if (nextStage === 'COMPLETED') {
        await handleCollect(pickup);
      }
    } catch (error) {
      setMessage(error.message || 'Could not update collection stage');
    }
  };

  // Prepare route polyline coordinates from Collector to active pickups
  const activePickup = sortedPickups.find(p => p.status === 'IN_PROGRESS') || sortedPickups[0];
  const routePolyline = activePickup && activePickup.lat && activePickup.lng
    ? [[location.lat, location.lng], [activePickup.lat, activePickup.lng]]
    : null;

  return (
    <div style={{ background: '#F8FAF8', minHeight: '100vh', padding: '24px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1340px', margin: '0 auto' }}>
        
        {/* ══ HEADER ══ */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', borderRadius: '18px', padding: '18px 28px', boxShadow: '0 2px 14px rgba(15, 23, 42, 0.04)', border: '1px solid #E2E8F0', color: '#0F172A' }}>
          <div>
            <GreenGoldLogo size={42} textColor="#0F172A" subtextColor="#065F46" subtitle="Route & Pickup Operations" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#065F46' }}>
                Driver: {user?.fullName || 'Collector Active'} ({user?.employeeId || 'C-101'})
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{ background: '#EF4444', border: 'none', color: '#FFFFFF', borderRadius: '10px', padding: '9px 18px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)', transition: 'all 0.2s ease' }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {message && (
          <div style={{ marginTop: '20px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', padding: '12px 16px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{message}</span>
            <button onClick={() => setMessage('')} style={{ background: 'transparent', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: '800' }}>✕</button>
          </div>
        )}

        {/* ══ ACTIVE ASSIGNED SITE SUMMARY BANNER ══ */}
        {activePickup && (
          <div style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
            borderRadius: '16px',
            padding: '16px 24px',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 6px 20px rgba(6,78,59,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                📍
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: '#EF4444', color: '#FFF', padding: '3px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                    {activePickup.status === 'IN_PROGRESS' ? 'CURRENT ACTIVE ROUTE' : 'NEXT TARGET SITE'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#A7F3D0' }}>{activePickup.binId}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', marginTop: '2px' }}>
                  {activePickup.locationName || activePickup.siteName}
                </div>
                <div style={{ fontSize: '12.5px', color: '#D1FAE5' }}>
                  {activePickup.address}, {activePickup.town} · Fill: <strong>{activePickup.fillLevel}%</strong> · {activePickup.wasteType || 'Recyclables'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setFocusedTarget(activePickup)}
                style={{
                  background: '#FFFFFF',
                  color: '#065F46',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                🎯 Focus on Map
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activePickup.lat},${activePickup.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontWeight: '800',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🗺️ Google Maps Navigation ↗
              </a>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 0.75fr', gap: '24px', marginTop: '20px' }}>
          
          {/* ══ LIVE MAP SECTION ══ */}
          <section style={{ borderRadius: '20px', overflow: 'hidden', background: 'white', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Live Route & Pickup Map</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12.5px' }}>
                  GPS Tracking & Target Bin Locations ({sortedPickups.length} active site{sortedPickups.length === 1 ? '' : 's'})
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ background: '#ecfdf5', color: '#047857', borderRadius: '999px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ● GPS Active
                </span>
              </div>
            </div>

            <div style={{ height: '480px', width: '100%', position: 'relative' }}>
              <MapContainer 
                center={[location.lat, location.lng]} 
                zoom={13} 
                scrollWheelZoom 
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer 
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />

                {/* Auto-Fit Bounds Handler */}
                <MapBoundsHandler 
                  collectorLocation={location} 
                  pickups={sortedPickups} 
                  focusedTarget={focusedTarget} 
                />

                {/* Collector Marker */}
                <Marker position={[location.lat, location.lng]} icon={collectorIcon}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ color: '#059669', fontSize: '13px' }}>🚛 Collector Location</strong>
                      <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>
                        Driver: {user?.fullName || 'Collector Active'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                        GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                <Circle 
                  center={[location.lat, location.lng]} 
                  radius={200} 
                  pathOptions={{ color: '#10b981', fillColor: '#34d399', fillOpacity: 0.15 }} 
                />

                {/* Target Pickup Bin Markers */}
                {(sortedPickups || []).map((pickup) => (
                  <Marker 
                    key={pickup.id || pickup._id || pickup.binId} 
                    position={[pickup.lat, pickup.lng]} 
                    icon={createPickupIcon(pickup.fillLevel, (pickup.fillLevel >= 85 || pickup.urgency === 'High'))}
                    eventHandlers={{
                      click: () => setFocusedTarget(pickup)
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '220px', padding: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ background: '#DC2626', color: '#FFF', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                            {pickup.fillLevel}% FULL
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669' }}>
                            {pickup.binId}
                          </span>
                        </div>
                        <strong style={{ fontSize: '14px', color: '#111827', display: 'block' }}>
                          {pickup.locationName || pickup.siteName}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#4B5563', margin: '4px 0' }}>
                          📍 {pickup.address}, {pickup.town}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0' }}>
                          📦 Stream: <strong>{pickup.wasteType || 'Organic/Compost'}</strong>
                        </div>
                        
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                          {pickup.status === 'ASSIGNED' ? (
                            <button
                              onClick={() => handleAcceptAssignment(pickup)}
                              style={{ flex: 1, padding: '6px 10px', background: '#1D4ED8', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Accept Duty
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCollect(pickup)}
                              style={{ flex: 1, padding: '6px 10px', background: '#059669', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Mark Collected
                            </button>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pickup.lat},${pickup.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ padding: '6px 10px', background: '#F3F4F6', color: '#374151', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            🗺️
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Dashed Route line between collector and active pickup */}
                {routePolyline && (
                  <Polyline 
                    positions={routePolyline} 
                    pathOptions={{ color: '#059669', weight: 4, dashArray: '8, 8', opacity: 0.8 }} 
                  />
                )}
              </MapContainer>
            </div>
          </section>

          {/* ══ URGENCY QUEUE ASIDE ══ */}
          <aside style={{ borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)', padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Urgency Queue</h2>
                <span style={{ fontSize: '11px', fontWeight: '800', background: '#F3F4F6', color: '#4B5563', padding: '4px 8px', borderRadius: '999px' }}>
                  {sortedPickups.length} Pickups
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>Sorted by fill level & urgency</p>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: '#64748b' }}>
                Loading pickup queue...
              </div>
            ) : !sortedPickups.length ? (
              <div style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '12px', padding: '20px', fontWeight: 700, textAlign: 'center' }}>
                ✅ No active pickups remaining. All bins serviced!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
                {sortedPickups.map((pickup) => {
                  const isSelected = focusedTarget?.id === pickup.id || focusedTarget?.binId === pickup.binId;
                  return (
                    <div 
                      key={pickup.id || pickup._id || pickup.binId} 
                      onClick={() => setFocusedTarget(pickup)}
                      style={{ 
                        padding: '14px', 
                        borderRadius: '14px', 
                        background: isSelected ? '#F0FDF4' : '#f8fafc', 
                        border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{pickup.locationName || pickup.siteName}</div>
                          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700' }}>{pickup.binId} · {pickup.town}</div>
                        </div>
                        <span style={{ 
                          background: pickup.fillLevel >= 85 ? '#FEE2E2' : '#FEF3C7', 
                          color: pickup.fillLevel >= 85 ? '#DC2626' : '#B45309', 
                          borderRadius: '999px', 
                          fontSize: '10px', 
                          fontWeight: 800, 
                          letterSpacing: '0.08em', 
                          textTransform: 'uppercase', 
                          padding: '4px 8px', 
                          alignSelf: 'flex-start' 
                        }}>
                          {pickup.fillLevel}% FULL
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                        📍 {pickup.address}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: '#475569', background: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                        <div>Stream: <strong>{pickup.wasteType || 'Organic'}</strong></div>
                        <div>Status: <strong style={{ color: pickup.status === 'IN_PROGRESS' ? '#059669' : '#D97706' }}>{pickup.status}</strong></div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <RequestProgressTracker
                          status={pickup.status || 'VIEWED'}
                          variant="collection"
                          interactive={true}
                          onStageChange={(stageKey) => handleProgressStageUpdate(pickup, stageKey)}
                          compact={true}
                          label="Progress"
                        />
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {pickup.status === 'ASSIGNED' ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAcceptAssignment(pickup); }}
                            style={{
                              flex: 1,
                              background: '#1D4ED8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
                            }}
                          >
                            Accept Duty
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCollect(pickup); }}
                            style={{
                              flex: 1,
                              background: '#047857',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)'
                            }}
                          >
                            Mark Collected
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleFlagContamination(pickup); }}
                          style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FCD34D',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Flag Contamination
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
                Contamination Notes
              </label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', resize: 'vertical', fontSize: '12.5px', color: '#0f172a' }} 
                placeholder="Example: Full of plastic and glass mix..." 
              />
            </div>
          </aside>
        </div>
      </div>
      <DashboardAssistant dashboardName="collector" accent="#22C55E" />
    </div>
  );
}
