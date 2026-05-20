import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { getFlowHeatmap } from '../services/api';

// Inner component injects a heat layer into the Leaflet map. Falls back to
// nothing (parent draws fallback circles) if the plugin is not registered.
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !points || !points.length) return undefined;
    if (typeof L.heatLayer !== 'function') return undefined;

    const arr = points.map((p) => [p.lat, p.lng, p.weight]);
    const layer = L.heatLayer(arr, {
      radius: 25,
      blur: 18,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#3b82f6',
        0.4: '#22c55e',
        0.6: '#eab308',
        0.8: '#f97316',
        1.0: '#dc2626',
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

function swatch(color) {
  return {
    display: 'inline-block',
    width: 12,
    height: 12,
    background: color,
    borderRadius: 2,
    marginRight: 4,
    verticalAlign: 'middle',
  };
}

export default function FlowHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getFlowHeatmap()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  if (err) return <div className="ai-error">{err}</div>;
  if (!data) return <div>Loading flow heatmap...</div>;

  const center = [Number(data.center?.lat) || 37.7793, Number(data.center?.lng) || -122.4192];
  const points = (data.points || []).filter((p) => p.lat != null && p.lng != null);
  const heatAvailable = typeof L.heatLayer === 'function';

  function colorFor(w) {
    if (w >= 0.8) return '#dc2626';
    if (w >= 0.6) return '#f97316';
    if (w >= 0.4) return '#eab308';
    if (w >= 0.2) return '#22c55e';
    return '#3b82f6';
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, flexWrap: 'wrap' }}>
        <span><span style={swatch('#3b82f6')} /> low flow</span>
        <span><span style={swatch('#22c55e')} /> moderate</span>
        <span><span style={swatch('#eab308')} /> elevated</span>
        <span><span style={swatch('#f97316')} /> congested</span>
        <span><span style={swatch('#dc2626')} /> heavy congestion</span>
        <span style={{ marginLeft: 'auto', color: '#6b7280' }}>
          {points.length} intersections · {heatAvailable ? 'heat layer' : 'fallback markers'}
        </span>
      </div>
      <MapContainer center={center} zoom={14} style={{ height: 460, width: '100%', borderRadius: 8 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
        {/* Fallback (and clickable popups): scaled circle markers per intersection */}
        {points.map((p, i) => (
          <CircleMarker
            key={`${p.intersection_id}-${i}`}
            center={[p.lat, p.lng]}
            radius={6 + Math.round(p.weight * 12)}
            pathOptions={{
              color: colorFor(p.weight),
              fillColor: colorFor(p.weight),
              fillOpacity: heatAvailable ? 0.35 : 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{p.name || p.intersection_id}</strong>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  Congestion weight: <b>{p.weight}</b>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
