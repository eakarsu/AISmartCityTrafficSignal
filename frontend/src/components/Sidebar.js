import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

// Overview / Intersections / Signals / Plans / Incidents / Transit Priority / Work Zones
// Governance / AI Operations / AI Reporting / Admin
const INTERSECTIONS = [
  { to: '/intersections',           label: 'Intersections' },
  { to: '/controllers',             label: 'Controllers' },
  { to: '/communications-cabinets', label: 'Comms Cabinets' },
  { to: '/video-feeds',             label: 'Video Feeds' },
];

const SIGNALS_GROUP = [
  { to: '/signals',                 label: 'Signals' },
  { to: '/detectors',               label: 'Detectors' },
  { to: '/sensors-health',          label: 'Sensors Health' },
  { to: '/pedestrian-phases',       label: 'Pedestrian Phases' },
  { to: '/bike-phases',             label: 'Bike Phases' },
];

const PLANS_GROUP = [
  { to: '/signal-plans',            label: 'Signal Plans' },
  { to: '/signal-groups',           label: 'Signal Groups' },
];

const INCIDENTS_GROUP = [
  { to: '/incidents',               label: 'Incidents' },
  { to: '/emergency-preemptions',   label: 'Emergency Preemptions' },
];

const TRANSIT_GROUP = [
  { to: '/transit-priorities',      label: 'Transit Priority' },
];

const WORKZONE_GROUP = [
  { to: '/work-zones',              label: 'Work Zones' },
  { to: '/special-events',          label: 'Special Events' },
];

const GOVERNANCE_GROUP = [
  { to: '/performance-metrics',     label: 'Performance Metrics' },
  { to: '/audit-log',               label: 'Audit Log' },
  // Pass 7 — equity-by-neighborhood operator-curated dataset
  { to: '/equity-neighborhoods',    label: 'Equity Neighborhoods' },
];

// AI Operations (live decision-support)
const AI_OPS = [
  { to: '/ai/incident-aware-retime',    label: 'AI · Incident-Aware Retime' },
  { to: '/ai/ped-conflict-detect',      label: 'AI · Ped Conflict Detect' },
  { to: '/ai/transit-priority-suggest', label: 'AI · Transit Priority Suggest' },
  { to: '/ai/work-zone-signal-plan',    label: 'AI · Work Zone Plan' },
  { to: '/ai/special-event-signal-plan',label: 'AI · Special Event Plan' },
  { to: '/ai/corridor-coordination',    label: 'AI · Corridor Coordination' },
  { to: '/ai/intersection-prioritize',  label: 'AI · Intersection Prioritize' },
  { to: '/ai/work-order-draft',         label: 'AI · Work Order Draft' },
  // Pass 7 — full backlog AI verbs (advisory only)
  { to: '/ai/congestion-forecast',          label: 'AI · Congestion Forecast' },
  { to: '/ai/signal-timing-optimize',       label: 'AI · Signal Timing Optimize' },
  { to: '/ai/emergency-preempt-sequence',   label: 'AI · Emergency Preempt Sequence' },
  { to: '/ai/incident-response-coordinate', label: 'AI · Incident Response Coordinate' },
];

// AI Reporting (analysis / briefs)
const AI_REPORT = [
  { to: '/ai/executive-brief',          label: 'AI · Executive Brief' },
  { to: '/ai/signal-health-prognostic', label: 'AI · Signal Health Prognostic' },
  { to: '/ai/equity-impact-brief',      label: 'AI · Equity Impact' },
  { to: '/ai/equity-response-time',     label: 'AI · Equity Response Time' },
  { to: '/ai/emission-impact-estimate', label: 'AI · Emission Impact' },
  { to: '/ai/citizen-complaint-summary',label: 'AI · Citizen Complaints' },
  { to: '/ai/sensor-anomaly',           label: 'AI · Sensor Anomaly' },
  { to: '/ai/performance-anomaly',      label: 'AI · Performance Anomaly' },
  { to: '/ai/vendor-quality-score',     label: 'AI · Vendor Quality Score' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>TRAFFIC SIGNAL</h1>
        <p>Adaptive Smart-City Ops</p>
      </div>

      <NavLink to="/" end>Overview</NavLink>
      <NavLink to="/custom-views">City Views</NavLink>

      <div className="sidebar-group-label">Intersections</div>
      {INTERSECTIONS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Signals</div>
      {SIGNALS_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Plans</div>
      {PLANS_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Incidents</div>
      {INCIDENTS_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Transit Priority</div>
      {TRANSIT_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Work Zones</div>
      {WORKZONE_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Governance</div>
      {GOVERNANCE_GROUP.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">AI Operations</div>
      {AI_OPS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">AI Reporting</div>
      {AI_REPORT.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
