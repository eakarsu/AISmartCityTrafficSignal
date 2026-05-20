import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getIntersectionMap } from '../services/api';

function colorFor(item) {
  const c = String(item.latest_color || '').toLowerCase();
  if (c === 'green') return '#16a34a';
  if (c === 'yellow') return '#eab308';
  if (c === 'red') return '#dc2626';
  if (c === 'flash') return '#f97316';
  // fall back to intersection status
  const s = String(item.status || '').toLowerCase();
  if (s === 'operational') return '#16a34a';
  if (s === 'degraded') return '#eab308';
  if (s === 'maintenance') return '#3b82f6';
  return '#6b7280';
}

export default function IntersectionMap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getIntersectionMap()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  if (err) return <div className="ai-error">{err}</div>;
  if (!data) return <div>Loading intersections...</div>;

  const center = [Number(data.center?.lat) || 37.7793, Number(data.center?.lng) || -122.4192];
  const items = (data.items || []).filter((i) => i.lat != null && i.lng != null);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, flexWrap: 'wrap' }}>
        <span><span style={swatch('#16a34a')} /> green</span>
        <span><span style={swatch('#eab308')} /> yellow</span>
        <span><span style={swatch('#dc2626')} /> red</span>
        <span><span style={swatch('#f97316')} /> flash/fault</span>
        <span><span style={swatch('#6b7280')} /> unknown</span>
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
            radius={10}
            pathOptions={{
              color: colorFor(it),
              fillColor: colorFor(it),
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{it.name || it.intersection_id}</strong>
                <div style={{ fontSize: 11, color: '#666' }}>{it.location}</div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Status: <b>{it.status}</b><br />
                  Signal: <b>{it.latest_color || 'n/a'}</b> ({it.latest_signal_status || 'n/a'})<br />
                  Signals: {it.signal_count}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function swatch(color) {
  return {
    display: 'inline-block',
    width: 10,
    height: 10,
    background: color,
    borderRadius: '50%',
    marginRight: 4,
    verticalAlign: 'middle',
  };
}
