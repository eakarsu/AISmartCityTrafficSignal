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
