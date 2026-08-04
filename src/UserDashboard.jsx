import React from 'react';

export default function UserDashboard() {
  return (
    <div className="mgmt-sub-view">
      <div className="view-header">
        <div>
          <h2>Generator Impact Hub</h2>
          <p>Track your organic waste streams, rewards, and ESG contribution.</p>
        </div>
        <button className="login-btn" style={{ width: 'auto', padding: '10px 20px' }}>
          + Request Extra Pickup
        </button>
      </div>

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
        <h3>Recent Disposal Events</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Smart Bin ID</th>
              <th>Weight (kg)</th>
              <th>Waste Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Today, 11:20 AM</td>
              <td>BIN-MARRIOTT-01</td>
              <td>42.5 kg</td>
              <td>Kitchen Organics</td>
              <td><span className="status-pill approved">Collected</span></td>
            </tr>
            <tr>
              <td>Today, 08:15 AM</td>
              <td>BIN-MARRIOTT-02</td>
              <td>18.0 kg</td>
              <td>Coffee Grounds</td>
              <td><span className="status-pill approved">Collected</span></td>
            </tr>
            <tr>
              <td>Yesterday, 09:40 PM</td>
              <td>BIN-MARRIOTT-01</td>
              <td>55.2 kg</td>
              <td>Food Scraps</td>
              <td><span className="status-pill approved">Processed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}