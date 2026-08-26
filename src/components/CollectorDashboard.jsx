import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import DashboardAssistant from './DashboardAssistant';
import RequestProgressTracker from './RequestProgressTracker';

const collectorIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#10b981;border:3px solid white;box-shadow:0 6px 18px rgba(16,185,129,0.45);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#f59e0b;border:3px solid white;box-shadow:0 6px 18px rgba(245,158,11,0.45);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function CollectorDashboard({ onLogout }) {
  const { user } = useAuth();
  const collectorId = user?.id || 'COL-1001';

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: 33.6844, lng: 73.0479 });
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  const sortedPickups = useMemo(() => {
    if (!route?.pickups) return [];
    return [...route.pickups].sort((a, b) => (b.timeFullMinutes || 0) - (a.timeFullMinutes || 0));
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

  const loadRoute = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getMyAssignments();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      const firstJob = jobs[0];
      const current = firstJob ? { lat: Number(firstJob.lat || 33.6844), lng: Number(firstJob.lng || 73.0479) } : { lat: 33.6844, lng: 73.0479 };
      setRoute({ collectorId, currentLocation: current, pickups: jobs });
      setLocation(current);
    } catch (error) {
      console.error('Route load failed:', error);
      setRoute({ collectorId, currentLocation: { lat: 33.6844, lng: 73.0479 }, pickups: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoute();
    const interval = setInterval(() => {
      loadRoute();
    }, 3000);
    return () => clearInterval(interval);
  }, [collectorId]);

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      const coords = await resolveLocation();
      if (!mounted) return;
      setLocation(coords);
      try {
        // Local GPS update is intentionally kept lightweight; the live route is driven by management assignments.
      } catch (error) {
        console.warn('GPS update failed:', error);
      }
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
    } catch (error) {
      setMessage(error.message || 'Could not accept pickup duty');
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

  const handleCollect = async (pickup) => {
    try {
      const targetId = pickup._id || pickup.assignmentId || pickup.id;
      const result = await api.collector.completeAssignment(targetId);
      setMessage(result.message || 'Pickup marked as collected and task completed!');
      setRoute((prev) => ({
        ...prev,
        pickups: (prev?.pickups || []).filter((item) => (item._id || item.assignmentId || item.id) !== targetId),
      }));
    } catch (error) {
      setMessage(error.message || 'Could not complete pickup');
    }
  };

  const currentCenter = route?.currentLocation ? [route.currentLocation.lat, route.currentLocation.lng] : [location.lat, location.lng];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #064e3b, #047857)', borderRadius: '20px', padding: '24px 28px', boxShadow: '0 16px 32px rgba(6, 78, 59, 0.18)', color: 'white' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.8 }}>Waste Collector Portal</div>
            <h1 style={{ margin: '8px 0 0', fontSize: '30px', fontWeight: 800 }}>Route & Pickup Operations</h1>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
          >
            Logout
          </button>
        </header>

        {message && (
          <div style={{ marginTop: '20px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', padding: '12px 16px', fontWeight: 600 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '24px', marginTop: '24px' }}>
          <section style={{ borderRadius: '20px', overflow: 'hidden', background: 'white', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Live Collection Map</h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Current GPS and assigned pickup locations</p>
              </div>
              <div style={{ background: '#ecfdf5', color: '#047857', borderRadius: '999px', padding: '7px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live</div>
            </div>

            <div style={{ height: '440px', width: '100%' }}>
              <MapContainer center={currentCenter} zoom={13} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={[location.lat, location.lng]} icon={collectorIcon}>
                  <Popup>
                    <div>
                      <strong>Collector Location</strong>
                      <br />
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </div>
                  </Popup>
                </Marker>

                <Circle center={[location.lat, location.lng]} radius={250} pathOptions={{ color: '#10b981', fillColor: '#34d399', fillOpacity: 0.2 }} />

                {(sortedPickups || []).map((pickup) => (
                  <Marker key={pickup.id} position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                    <Popup>
                      <div>
                        <strong>{pickup.locationName}</strong>
                        <br />
                        {pickup.address}
                        <br />
                        Fill: {pickup.fillLevel}%
                        <br />
                        Full for: {pickup.timeFullMinutes} mins
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>

          <aside style={{ borderRadius: '20px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)', padding: '22px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Urgency Queue</h2>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>Sorted by longest time full</p>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '150px', color: '#64748b' }}>Loading route...</div>
            ) : !sortedPickups.length ? (
              <div style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '12px', padding: '16px', fontWeight: 700 }}>No active pickups remaining in the route.</div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {sortedPickups.map((pickup) => (
                  <div key={pickup.id} style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{pickup.locationName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{pickup.binId}</div>
                      </div>
                      <span style={{ background: pickup.urgency === 'High' ? '#fee2e2' : '#fef3c7', color: pickup.urgency === 'High' ? '#b91c1c' : '#b45309', borderRadius: '999px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 8px', alignSelf: 'flex-start' }}>{pickup.urgency}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#475569' }}>
                      <div>Fill: <strong>{pickup.fillLevel}%</strong></div>
                      <div>Full: <strong>{pickup.timeFullMinutes}m</strong></div>
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <RequestProgressTracker
                        status={pickup.status || 'VIEWED'}
                        variant="collection"
                        interactive={true}
                        onStageChange={(stageKey) => handleProgressStageUpdate(pickup, stageKey)}
                        compact={true}
                        label="Collection task"
                      />
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {pickup.status === 'ASSIGNED' ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptAssignment(pickup)}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          ✅ Accept Duty (Start Route)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCollect(pickup)}
                          style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          🏁 Mark Collected / Done Task
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFlagContamination(pickup)}
                        style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FCD34D',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Flag Contamination
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Contamination Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 12px', resize: 'vertical', fontSize: '13px', color: '#0f172a' }} placeholder="Example: Full of plastic and glass mix..." />
            </div>
          </aside>
        </div>
      </div>
      <DashboardAssistant dashboardName="collector" accent="#22C55E" />
    </div>
  );
}
