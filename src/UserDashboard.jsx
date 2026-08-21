import React, { useEffect, useState } from 'react';

const getCollectionRequests = () => {
  try {
    const stored = localStorage.getItem('greengold_collection_requests');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

export default function UserDashboard() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    site: '',
    wasteType: 'Food Waste',
    weightKg: '120',
    notes: ''
  });

  useEffect(() => {
    setRequests(getCollectionRequests());
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = (event) => {
    event.preventDefault();

    const trimmedSite = formData.site.trim();
    const trimmedType = formData.wasteType.trim();
    const weight = Number(formData.weightKg);

    if (!trimmedSite || !trimmedType || !weight || weight <= 0) {
      return;
    }

    const nextRequest = {
      id: `COLL-${Date.now()}`,
      site: trimmedSite,
      wasteType: trimmedType,
      weightKg: weight,
      collectedDate: new Date().toISOString().slice(0, 10),
      status: 'Awaiting Partner',
      assignedPartner: null,
      notes: formData.notes.trim()
    };

    const existing = getCollectionRequests();
    const updated = [nextRequest, ...existing];
    localStorage.setItem('greengold_collection_requests', JSON.stringify(updated));
    setRequests(updated);

    setFormData({
      site: '',
      wasteType: 'Food Waste',
      weightKg: '120',
      notes: ''
    });
    setShowRequestModal(false);
  };

  return (
    <div className="mgmt-sub-view">
      <div className="view-header">
        <div>
          <h2>Generator Impact Hub</h2>
          <p>Track your organic waste streams, rewards, and ESG contribution.</p>
        </div>
        <button
          className="login-btn"
          type="button"
          onClick={() => setShowRequestModal(true)}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          Request Waste Collection
        </button>
      </div>

      {showRequestModal && (
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Request Waste Collection</h3>
            <form onSubmit={handleSubmitRequest}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label htmlFor="collection-site" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Site Name</label>
                  <input id="collection-site" name="site" value={formData.site} onChange={handleFieldChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} placeholder="e.g. North Ridge Apartments" />
                </div>
                <div>
                  <label htmlFor="collection-type" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Waste Type</label>
                  <input id="collection-type" name="wasteType" value={formData.wasteType} onChange={handleFieldChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="collection-weight" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Estimated Weight</label>
                  <input id="collection-weight" name="weightKg" type="number" min="1" value={formData.weightKg} onChange={handleFieldChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="collection-notes" style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Notes</label>
                  <textarea id="collection-notes" name="notes" value={formData.notes} onChange={handleFieldChange} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', resize: 'vertical' }} placeholder="Optional access details" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-eco-secondary" onClick={() => setShowRequestModal(false)} style={{ padding: '10px 16px' }}>Cancel</button>
                <button type="submit" className="login-btn" style={{ width: 'auto', padding: '10px 16px' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Disposed Organic Waste</div>
          <div className="kpi-value">4,850 <span style={{fontSize: '18px', color: 'var(--text-muted)'}}>kg</span></div>
          <div className="kpi-label">This Month</div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Green Rewards Earned</div>
          <div className="kpi-value">1,240 <span style={{fontSize: '18px', color: 'var(--gold-light)'}}>PTS</span></div>
          <div className="kpi-label">Tier: Gold Contributor</div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Contamination Rate</div>
          <div className="kpi-value">0.4%</div>
          <div className="kpi-label" style={{color: 'var(--primary)'}}>Grade A Quality</div>
        </div>
      </div>

      <div className="glass-panel table-panel">
        <h3>Recent Waste Collection Requests</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Waste Type</th>
              <th>Weight (kg)</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No collection requests yet.</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.site}</td>
                  <td>{request.wasteType}</td>
                  <td>{request.weightKg} kg</td>
                  <td>{request.collectedDate}</td>
                  <td><span className="status-pill approved">{request.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}