import React from 'react';
import 'leaflet/dist/leaflet.css';

import IntersectionMap from '../components/IntersectionMap';
import SignalTimeline from '../components/SignalTimeline';
import IncidentMap from '../components/IncidentMap';
import PerformanceTrend from '../components/PerformanceTrend';
import FlowHeatmap from '../components/FlowHeatmap';
import SignalStateVisualizer from '../components/SignalStateVisualizer';

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  marginBottom: 24,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
const titleStyle = {
  margin: '0 0 12px 0',
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
};
const subStyle = {
  margin: '0 0 12px 0',
  fontSize: 12,
  color: '#6b7280',
};

export default function CustomViewsPage() {
  return (
    <div>
      <h1 style={{ margin: '0 0 6px 0' }}>City Views</h1>
      <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
        Geographic and time-series visualizations across the signal network.
      </p>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Intersection Status Map</h2>
        <p style={subStyle}>Each marker is colored by the latest reported signal color.</p>
        <IntersectionMap />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Signal State Timeline</h2>
        <p style={subStyle}>Phase durations over the last 10 minutes for the selected intersection.</p>
        <SignalTimeline />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Incident Cluster Map</h2>
        <p style={subStyle}>Incidents plotted by location and sized/colored by severity.</p>
        <IncidentMap />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Performance Trend Lines</h2>
        <p style={subStyle}>Multi-line trend of recorded performance KPIs.</p>
        <PerformanceTrend />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Citywide Traffic Flow Heatmap</h2>
        <p style={subStyle}>
          Heat layer over intersections weighted by current congestion (from
          performance metrics, with plausible fallback).
        </p>
        <FlowHeatmap />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Animated Intersection Signal-State Visualizer</h2>
        <p style={subStyle}>
          Live 4-way intersection diagram cycling through phases. Select an
          intersection to view its signal plan timings.
        </p>
        <SignalStateVisualizer />
      </div>
    </div>
  );
}
