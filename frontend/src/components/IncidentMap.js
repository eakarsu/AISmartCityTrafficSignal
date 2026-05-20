import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getIncidentMap } from '../services/api';

const SEV_COLOR = {
  critical: '#7f1d1d',
  high:     '#dc2626',
  medium:   '#f59e0b',
  low:      '#16a34a',
};

function colorFor(severity) {
  const s = String(severity || '').toLowerCase();
  return SEV_COLOR[s] || '#6b7280';
}
function radiusFor(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 14;
  if (s === 'high')     return 11;
  if (s === 'medium')   return 8;
  if (s === 'low')      return 6;
  return 7;
}

export default function IncidentMap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getIncidentMap()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  if (err) return <div className="ai-error">{err}</div>;
  if (!data) return <div>Loading incidents...</div>;

  const center = [Number(data.center?.lat) || 37.7793, Number(data.center?.lng) || -122.4192];
  const items = (data.items || []).filter((i) => i.lat != null && i.lng != null);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, flexWrap: 'wrap' }}>
        {Object.entries(SEV_COLOR).map(([sev, color]) => (
          <span key={sev}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              background: color, borderRadius: '50%',
              marginRight: 4, verticalAlign: 'middle',
            }} />
            {sev}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#666' }}>{items.length} incidents</span>
      </div>
      <MapContainer center={center} zoom={14} style={{ height: 460, width: '100%', borderRadius: 8 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items.map((it) => (
          <CircleMarker
            key={it.id}
            center={[Number(it.lat), Number(it.lng)]}
            radius={radiusFor(it.severity)}
            pathOptions={{
              color: colorFor(it.severity),
              fillColor: colorFor(it.severity),
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong>{it.incident_id} · {it.type}</strong>
                <div style={{ fontSize: 11, color: '#666' }}>{it.intersection_name || it.intersection_id}</div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Severity: <b>{it.severity}</b><br />
                  Status: <b>{it.status}</b><br />
                  Opened: {it.opened_at ? new Date(it.opened_at).toLocaleString() : 'n/a'}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
