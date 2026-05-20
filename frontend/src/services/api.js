const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  'http://localhost:3089/api';

export { API_BASE };

const TOKEN_KEY = 'tsig_token';
const USER_KEY  = 'tsig_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'ops'].includes(getRole());
}
export function isCommander() {
  return getRole() === 'admin';
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }
  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Generic CRUD factory
function crud(base) {
  return {
    list:   ()       => request(`/${base}`),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// 18 entities
export const intersectionsApi          = crud('intersections');
export const signalsApi                = crud('signals');
export const detectorsApi              = crud('detectors');
export const signalPlansApi            = crud('signal-plans');
export const incidentsApi              = crud('incidents');
export const transitPrioritiesApi      = crud('transit-priorities');
export const emergencyPreemptionsApi   = crud('emergency-preemptions');
export const pedestrianPhasesApi       = crud('pedestrian-phases');
export const bikePhasesApi             = crud('bike-phases');
export const workZonesApi              = crud('work-zones');
export const specialEventsApi          = crud('special-events');
export const signalGroupsApi           = crud('signal-groups');
export const communicationsCabinetsApi = crud('communications-cabinets');
export const sensorsHealthApi          = crud('sensors-health');
export const videoFeedsApi             = crud('video-feeds');
export const controllersApi            = crud('controllers');
export const performanceMetricsApi     = crud('performance-metrics');
export const auditLogApi               = crud('audit-log');

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI endpoints (16 verbs)
const aiPost = (verb) => (body) =>
  request(`/ai/${verb}`, { method: 'POST', body: JSON.stringify(body || {}) });

export const aiIncidentAwareRetime    = aiPost('incident-aware-retime');
export const aiPedConflictDetect      = aiPost('ped-conflict-detect');
export const aiTransitPrioritySuggest = aiPost('transit-priority-suggest');
export const aiWorkZoneSignalPlan     = aiPost('work-zone-signal-plan');
export const aiSpecialEventSignalPlan = aiPost('special-event-signal-plan');
export const aiExecutiveBrief         = aiPost('executive-brief');
export const aiSignalHealthPrognostic = aiPost('signal-health-prognostic');
export const aiEquityImpactBrief      = aiPost('equity-impact-brief');
export const aiEmissionImpactEstimate = aiPost('emission-impact-estimate');
export const aiCorridorCoordination   = aiPost('corridor-coordination');
export const aiIntersectionPrioritize = aiPost('intersection-prioritize');
export const aiCitizenComplaintSummary= aiPost('citizen-complaint-summary');
export const aiSensorAnomaly          = aiPost('sensor-anomaly');
export const aiWorkOrderDraft         = aiPost('work-order-draft');
export const aiPerformanceAnomaly     = aiPost('performance-anomaly');
export const aiVendorQualityScore     = aiPost('vendor-quality-score');

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications        = () => request('/notifications');
export const getUnreadNotifications  = () => request('/notifications/unread');
export const markNotificationRead    = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead= () => request('/notifications/mark-all-read', { method: 'POST' });

// Custom views
export const getIntersectionMap   = ()                => request('/custom-views/intersection-map');
export const getSignalTimeline    = (intersectionId)  =>
  request(`/custom-views/signal-timeline${intersectionId ? `?intersection_id=${encodeURIComponent(intersectionId)}` : ''}`);
export const getIncidentMap       = ()                => request('/custom-views/incident-map');
export const getPerformanceTrend  = ()                => request('/custom-views/performance-trend');
export const getFlowHeatmap       = ()                => request('/custom-views/flow-heatmap');
export const getSignalState       = (intersectionId)  =>
  request(`/custom-views/signal-state${intersectionId ? `?intersection_id=${encodeURIComponent(intersectionId)}` : ''}`);

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
