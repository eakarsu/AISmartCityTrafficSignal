import React, { useEffect, useState } from 'react';
import { getPublicDashboard, getPublicEquitySnapshot } from '../services/api';

export default function PublicDashboardPage() {
  const [data, setData] = useState(null);
  const [equity, setEquity] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getPublicDashboard(), getPublicEquitySnapshot()])
      .then(([d, eq]) => {
        if (!alive) return;
        setData(d);
        setEquity(eq);
      })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>City Traffic Signal Network — Public Dashboard</h1>
      <p style={{ color: '#666' }}>
        Aggregate, non-PII operational summary. No login required. Refreshed every 30 seconds.
      </p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
          <Card label="Intersections operational" value={`${data.network_health.operational_pct}%`} sub={`${data.network_health.intersections_operational}/${data.network_health.intersections_total}`} />
          <Card label="Signals in fault" value={data.signals.fault} sub={`of ${data.signals.total}`} />
          <Card label="Major incidents (open)" value={data.active_major_incidents} />
          <Card label="Active signal plans" value={data.active_signal_plans} />
          <Card label="Scheduled events" value={data.scheduled_special_events} />
          <Card label="Active work zones" value={data.active_work_zones} />
        </div>
      )}
      {equity && Array.isArray(equity.neighborhoods) && equity.neighborhoods.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2>Neighborhood Response-Time Snapshot</h2>
          <p style={{ color: '#666', fontSize: 14 }}>{equity.disclaimer}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                <th style={th}>Neighborhood</th>
                <th style={th}>Avg Response (minutes)</th>
              </tr>
            </thead>
            <tbody>
              {equity.neighborhoods.map((n) => (
                <tr key={n.neighborhood_id}>
                  <td style={td}>{n.name}</td>
                  <td style={td}>{n.avg_response_minutes != null ? n.avg_response_minutes.toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <p style={{ color: '#999', fontSize: 12, marginTop: 32 }}>{data.disclaimer}</p>
      )}
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #ddd' };
const td = { padding: '8px 12px', borderBottom: '1px solid #eee' };

function Card({ label, value, sub }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#fafafa' }}>
      <div style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
