import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/intersections',           title: 'Intersections',           icon: 'I', color: '#3b82f6', desc: 'Signalized intersections across the city network.' },
  { path: '/signals',                 title: 'Signals',                 icon: 'S', color: '#06b6d4', desc: 'Individual signal heads and their current color/state.' },
  { path: '/detectors',               title: 'Detectors',               icon: 'D', color: '#10b981', desc: 'Loop, video, radar and pedestrian detectors.' },
  { path: '/signal-plans',            title: 'Signal Plans',            icon: 'P', color: '#f59e0b', desc: 'Time-of-day signal plans deployed per intersection.' },
  { path: '/incidents',               title: 'Incidents',               icon: '!', color: '#ef4444', desc: 'Open and recent traffic-signal incidents.' },
  { path: '/transit-priorities',      title: 'Transit Priority',        icon: 'T', color: '#ec4899', desc: 'Transit signal priority registrations per route.' },
  { path: '/emergency-preemptions',   title: 'Emergency Preemptions',   icon: 'E', color: '#22c55e', desc: 'EMS / fire / police preempt events.' },
  { path: '/pedestrian-phases',       title: 'Pedestrian Phases',       icon: 'W', color: '#a78bfa', desc: 'Walk / Flash timings and recent crossings.' },
  { path: '/bike-phases',             title: 'Bike Phases',             icon: 'B', color: '#0ea5e9', desc: 'Dedicated bike signal phases and conflict movements.' },
  { path: '/work-zones',              title: 'Work Zones',              icon: 'Z', color: '#facc15', desc: 'Active and planned work zones affecting signals.' },
  { path: '/special-events',          title: 'Special Events',          icon: 'V', color: '#f472b6', desc: 'Stadium / parade / marathon and other event load.' },
  { path: '/signal-groups',           title: 'Signal Groups',           icon: 'G', color: '#14b8a6', desc: 'Coordinated corridors and signal subnetworks.' },
  { path: '/communications-cabinets', title: 'Comms Cabinets',          icon: 'C', color: '#a3e635', desc: 'Field cabinets, vendor and reachability.' },
  { path: '/sensors-health',          title: 'Sensors Health',          icon: 'H', color: '#7dd3fc', desc: 'Sensor battery, status and last signal.' },
  { path: '/video-feeds',             title: 'Video Feeds',             icon: 'M', color: '#fb7185', desc: 'Intersection camera feeds and last image.' },
  { path: '/controllers',             title: 'Controllers',             icon: 'X', color: '#60a5fa', desc: 'Signal controllers, vendor and firmware.' },
  { path: '/performance-metrics',     title: 'Performance Metrics',     icon: '%', color: '#34d399', desc: 'KPI samples per intersection / period.' },
  { path: '/audit-log',               title: 'Audit Log',               icon: 'A', color: '#dc2626', desc: 'Operator actions and outcomes.' },

  { path: '/ai/incident-aware-retime',    title: 'AI · Incident-Aware Retime',    icon: '*', color: '#8b5cf6', desc: 'Re-time signals around an open incident.' },
  { path: '/ai/ped-conflict-detect',      title: 'AI · Ped Conflict Detect',      icon: '*', color: '#8b5cf6', desc: 'Score pedestrian-vehicle conflict risk.' },
  { path: '/ai/transit-priority-suggest', title: 'AI · Transit Priority Suggest', icon: '*', color: '#8b5cf6', desc: 'Pick best TSP candidates for a route.' },
  { path: '/ai/work-zone-signal-plan',    title: 'AI · Work Zone Plan',           icon: '*', color: '#8b5cf6', desc: 'Temporary signal plan for a work zone.' },
  { path: '/ai/special-event-signal-plan',title: 'AI · Special Event Plan',       icon: '*', color: '#8b5cf6', desc: 'Load-in / egress signal plan for an event.' },
  { path: '/ai/corridor-coordination',    title: 'AI · Corridor Coordination',    icon: '*', color: '#8b5cf6', desc: 'Recommend green-wave offsets along a corridor.' },
  { path: '/ai/intersection-prioritize',  title: 'AI · Intersection Prioritize',  icon: '*', color: '#8b5cf6', desc: 'Rank intersections for retiming attention.' },
  { path: '/ai/work-order-draft',         title: 'AI · Work Order Draft',         icon: '*', color: '#8b5cf6', desc: 'Draft a field work order from a problem.' },
  { path: '/ai/executive-brief',          title: 'AI · Executive Brief',          icon: '*', color: '#8b5cf6', desc: 'City-level operational snapshot brief.' },
  { path: '/ai/signal-health-prognostic', title: 'AI · Signal Health Prognostic', icon: '*', color: '#8b5cf6', desc: 'Forecast device failures network-wide.' },
  { path: '/ai/equity-impact-brief',      title: 'AI · Equity Impact',            icon: '*', color: '#8b5cf6', desc: 'Assess equity impact of a signal policy.' },
  { path: '/ai/emission-impact-estimate', title: 'AI · Emission Impact',          icon: '*', color: '#8b5cf6', desc: 'Estimate CO2 impact of a timing change.' },
  { path: '/ai/citizen-complaint-summary',title: 'AI · Citizen Complaints',       icon: '*', color: '#8b5cf6', desc: 'Theme + hotspot complaints summary.' },
  { path: '/ai/sensor-anomaly',           title: 'AI · Sensor Anomaly',           icon: '*', color: '#8b5cf6', desc: 'Find anomalous detector/sensor behavior.' },
  { path: '/ai/performance-anomaly',      title: 'AI · Performance Anomaly',      icon: '*', color: '#8b5cf6', desc: 'Find off-target intersection KPIs.' },
  { path: '/ai/vendor-quality-score',     title: 'AI · Vendor Quality Score',     icon: '*', color: '#8b5cf6', desc: 'Score hardware vendors on field history.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Traffic Signal Overview</h2>
        <p>Unified network picture · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Intersections</div><div className="stat-value">{stats.intersections?.total ?? '—'}</div><div className="stat-sub">{stats.intersections?.operational ?? 0} operational · {stats.intersections?.degraded ?? 0} degraded</div></div>
          <div className="stat"><div className="stat-label">Signals</div><div className="stat-value">{stats.signals?.total ?? '—'}</div><div className="stat-sub">{stats.signals?.fault ?? 0} fault · {stats.signals?.preempt ?? 0} preempt</div></div>
          <div className="stat"><div className="stat-label">Detectors</div><div className="stat-value">{stats.detectors?.total ?? '—'}</div><div className="stat-sub">{stats.detectors?.active ?? 0} active · {stats.detectors?.down ?? 0} down</div></div>
          <div className="stat"><div className="stat-label">Plans</div><div className="stat-value">{stats.signal_plans?.total ?? '—'}</div><div className="stat-sub">{stats.signal_plans?.active ?? 0} active · {stats.signal_plans?.staged ?? 0} staged</div></div>
          <div className="stat"><div className="stat-label">Incidents</div><div className="stat-value">{stats.incidents?.total ?? '—'}</div><div className="stat-sub">{stats.incidents?.open ?? 0} open · {stats.incidents?.high ?? 0} high/critical</div></div>
          <div className="stat"><div className="stat-label">Transit Priority</div><div className="stat-value">{stats.transit_priorities?.total ?? '—'}</div><div className="stat-sub">{stats.transit_priorities?.enabled ?? 0} enabled</div></div>
          <div className="stat"><div className="stat-label">Preemptions</div><div className="stat-value">{stats.emergency_preemptions?.total ?? '—'}</div><div className="stat-sub">{stats.emergency_preemptions?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Ped Phases</div><div className="stat-value">{stats.pedestrian_phases?.total ?? '—'}</div><div className="stat-sub">{stats.pedestrian_phases?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Bike Phases</div><div className="stat-value">{stats.bike_phases?.total ?? '—'}</div><div className="stat-sub">{stats.bike_phases?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Work Zones</div><div className="stat-value">{stats.work_zones?.total ?? '—'}</div><div className="stat-sub">{stats.work_zones?.active ?? 0} active · {stats.work_zones?.planned ?? 0} planned</div></div>
          <div className="stat"><div className="stat-label">Events</div><div className="stat-value">{stats.special_events?.total ?? '—'}</div><div className="stat-sub">{stats.special_events?.scheduled ?? 0} scheduled</div></div>
          <div className="stat"><div className="stat-label">Signal Groups</div><div className="stat-value">{stats.signal_groups?.total ?? '—'}</div><div className="stat-sub">{stats.signal_groups?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Cabinets</div><div className="stat-value">{stats.communications_cabinets?.total ?? '—'}</div><div className="stat-sub">{stats.communications_cabinets?.healthy ?? 0} healthy · {stats.communications_cabinets?.down ?? 0} down</div></div>
          <div className="stat"><div className="stat-label">Sensors</div><div className="stat-value">{stats.sensors_health?.total ?? '—'}</div><div className="stat-sub">{stats.sensors_health?.ok ?? 0} ok · {stats.sensors_health?.impaired ?? 0} impaired</div></div>
          <div className="stat"><div className="stat-label">Video Feeds</div><div className="stat-value">{stats.video_feeds?.total ?? '—'}</div><div className="stat-sub">{stats.video_feeds?.streaming ?? 0} streaming · {stats.video_feeds?.offline ?? 0} offline</div></div>
          <div className="stat"><div className="stat-label">Controllers</div><div className="stat-value">{stats.controllers?.total ?? '—'}</div><div className="stat-sub">{stats.controllers?.online ?? 0} online · {stats.controllers?.impaired ?? 0} impaired</div></div>
          <div className="stat"><div className="stat-label">KPI Samples</div><div className="stat-value">{stats.performance_metrics?.total ?? '—'}</div><div className="stat-sub">latest period</div></div>
          <div className="stat"><div className="stat-label">Audit Log</div><div className="stat-value">{stats.audit_log?.total ?? '—'}</div><div className="stat-sub">operator entries</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
