import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 CRUD pages
import IntersectionsPage          from './pages/IntersectionsPage';
import SignalsPage                from './pages/SignalsPage';
import DetectorsPage              from './pages/DetectorsPage';
import SignalPlansPage            from './pages/SignalPlansPage';
import IncidentsPage              from './pages/IncidentsPage';
import TransitPrioritiesPage      from './pages/TransitPrioritiesPage';
import EmergencyPreemptionsPage   from './pages/EmergencyPreemptionsPage';
import PedestrianPhasesPage       from './pages/PedestrianPhasesPage';
import BikePhasesPage             from './pages/BikePhasesPage';
import WorkZonesPage              from './pages/WorkZonesPage';
import SpecialEventsPage          from './pages/SpecialEventsPage';
import SignalGroupsPage           from './pages/SignalGroupsPage';
import CommunicationsCabinetsPage from './pages/CommunicationsCabinetsPage';
import SensorsHealthPage          from './pages/SensorsHealthPage';
import VideoFeedsPage             from './pages/VideoFeedsPage';
import ControllersPage            from './pages/ControllersPage';
import PerformanceMetricsPage     from './pages/PerformanceMetricsPage';
import AuditLogPage               from './pages/AuditLogPage';

// 16 AI pages
import AIIncidentAwareRetimePage    from './pages/AIIncidentAwareRetimePage';
import AIPedConflictDetectPage      from './pages/AIPedConflictDetectPage';
import AITransitPrioritySuggestPage from './pages/AITransitPrioritySuggestPage';
import AIWorkZoneSignalPlanPage     from './pages/AIWorkZoneSignalPlanPage';
import AISpecialEventSignalPlanPage from './pages/AISpecialEventSignalPlanPage';
import AIExecutiveBriefPage         from './pages/AIExecutiveBriefPage';
import AISignalHealthPrognosticPage from './pages/AISignalHealthPrognosticPage';
import AIEquityImpactBriefPage      from './pages/AIEquityImpactBriefPage';
import AIEmissionImpactEstimatePage from './pages/AIEmissionImpactEstimatePage';
import AICorridorCoordinationPage   from './pages/AICorridorCoordinationPage';
import AIIntersectionPrioritizePage from './pages/AIIntersectionPrioritizePage';
import AICitizenComplaintSummaryPage from './pages/AICitizenComplaintSummaryPage';
import AISensorAnomalyPage          from './pages/AISensorAnomalyPage';
import AIWorkOrderDraftPage         from './pages/AIWorkOrderDraftPage';
import AIPerformanceAnomalyPage     from './pages/AIPerformanceAnomalyPage';
import AIVendorQualityScorePage     from './pages/AIVendorQualityScorePage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

// Custom views
import CustomViewsPage from './pages/CustomViewsPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// Pass 7 — full backlog implementation
import AICongestionForecastPage          from './pages/AICongestionForecastPage';
import AISignalTimingOptimizePage        from './pages/AISignalTimingOptimizePage';
import AIEmergencyPreemptSequencePage    from './pages/AIEmergencyPreemptSequencePage';
import AIIncidentResponseCoordinatePage  from './pages/AIIncidentResponseCoordinatePage';
import AIEquityResponseTimePage          from './pages/AIEquityResponseTimePage';
import EquityNeighborhoodsPage           from './pages/EquityNeighborhoodsPage';
import PublicDashboardPage               from './pages/PublicDashboardPage';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />

            <Route path="/intersections"           element={<IntersectionsPage />} />
            <Route path="/signals"                 element={<SignalsPage />} />
            <Route path="/detectors"               element={<DetectorsPage />} />
            <Route path="/signal-plans"            element={<SignalPlansPage />} />
            <Route path="/incidents"               element={<IncidentsPage />} />
            <Route path="/transit-priorities"      element={<TransitPrioritiesPage />} />
            <Route path="/emergency-preemptions"   element={<EmergencyPreemptionsPage />} />
            <Route path="/pedestrian-phases"       element={<PedestrianPhasesPage />} />
            <Route path="/bike-phases"             element={<BikePhasesPage />} />
            <Route path="/work-zones"              element={<WorkZonesPage />} />
            <Route path="/special-events"          element={<SpecialEventsPage />} />
            <Route path="/signal-groups"           element={<SignalGroupsPage />} />
            <Route path="/communications-cabinets" element={<CommunicationsCabinetsPage />} />
            <Route path="/sensors-health"          element={<SensorsHealthPage />} />
            <Route path="/video-feeds"             element={<VideoFeedsPage />} />
            <Route path="/controllers"             element={<ControllersPage />} />
            <Route path="/performance-metrics"     element={<PerformanceMetricsPage />} />
            <Route path="/audit-log"               element={<AuditLogPage />} />

            <Route path="/ai/incident-aware-retime"    element={<AIIncidentAwareRetimePage />} />
            <Route path="/ai/ped-conflict-detect"      element={<AIPedConflictDetectPage />} />
            <Route path="/ai/transit-priority-suggest" element={<AITransitPrioritySuggestPage />} />
            <Route path="/ai/work-zone-signal-plan"    element={<AIWorkZoneSignalPlanPage />} />
            <Route path="/ai/special-event-signal-plan" element={<AISpecialEventSignalPlanPage />} />
            <Route path="/ai/executive-brief"          element={<AIExecutiveBriefPage />} />
            <Route path="/ai/signal-health-prognostic" element={<AISignalHealthPrognosticPage />} />
            <Route path="/ai/equity-impact-brief"      element={<AIEquityImpactBriefPage />} />
            <Route path="/ai/emission-impact-estimate" element={<AIEmissionImpactEstimatePage />} />
            <Route path="/ai/corridor-coordination"    element={<AICorridorCoordinationPage />} />
            <Route path="/ai/intersection-prioritize"  element={<AIIntersectionPrioritizePage />} />
            <Route path="/ai/citizen-complaint-summary" element={<AICitizenComplaintSummaryPage />} />
            <Route path="/ai/sensor-anomaly"           element={<AISensorAnomalyPage />} />
            <Route path="/ai/work-order-draft"         element={<AIWorkOrderDraftPage />} />
            <Route path="/ai/performance-anomaly"      element={<AIPerformanceAnomalyPage />} />
            <Route path="/ai/vendor-quality-score"     element={<AIVendorQualityScorePage />} />

            {/* Pass 7 — full backlog AI verbs */}
            <Route path="/ai/congestion-forecast"          element={<AICongestionForecastPage />} />
            <Route path="/ai/signal-timing-optimize"       element={<AISignalTimingOptimizePage />} />
            <Route path="/ai/emergency-preempt-sequence"   element={<AIEmergencyPreemptSequencePage />} />
            <Route path="/ai/incident-response-coordinate" element={<AIIncidentResponseCoordinatePage />} />
            <Route path="/ai/equity-response-time"         element={<AIEquityResponseTimePage />} />
            <Route path="/equity-neighborhoods"            element={<EquityNeighborhoodsPage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />

            <Route path="/custom-views" element={<CustomViewsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Pass 7 — public unauthenticated dashboard surface */}
        <Route path="/public" element={<PublicDashboardPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
