const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./config/database');
const { fireWebhook } = require('./services/webhooks');

async function onIncidentCreated(row) {
  const sev = String(row.severity || '').toLowerCase();
  if (['critical', 'high'].includes(sev)) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, severity, source)
         VALUES (NULL, $1, $2, $3, $4)`,
        [`Incident: ${row.type}`,
         `${row.intersection_id} — opened ${row.opened_at || ''}`.slice(0, 1000),
         sev,
         'incidents']
      );
    } catch (e) { console.warn('[notify] incident insert failed:', e.message); }
    fireWebhook(`incident.${sev}`, { row }).catch(() => {});
  }
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3089;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3088,http://localhost:3089,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Pass 7 — Public (unauthenticated) read-only dashboard surface.
// Mounted BEFORE the Bearer-token middleware on purpose.
// Exposes only aggregate, non-PII counts. See routes/publicDashboard.js.
app.use('/api/public/dashboard', require('./routes/publicDashboard'));

// Everything below this line requires a Bearer token.
app.use('/api', authenticateToken);
app.use('/api/traffic-workflow', require('./routes/trafficWorkflow'));
app.use(/^\/api\/(?:gap-|ai-)/, (req, res) => res.status(503).json({
  error: 'Generated AI routes are quarantined; use /api/traffic-workflow', retryable: false,
}));

// 18 CRUD entities
app.use('/api/intersections',           require('./routes/intersections'));
app.use('/api/signals',                 require('./routes/signals'));
app.use('/api/detectors',               require('./routes/detectors'));
app.use('/api/signal-plans',            require('./routes/signalPlans'));
app.use('/api/incidents',               require('./routes/incidents'));
app.use('/api/transit-priorities',      require('./routes/transitPriorities'));
app.use('/api/emergency-preemptions',   require('./routes/emergencyPreemptions'));
app.use('/api/pedestrian-phases',       require('./routes/pedestrianPhases'));
app.use('/api/bike-phases',             require('./routes/bikePhases'));
app.use('/api/work-zones',              require('./routes/workZones'));
app.use('/api/special-events',          require('./routes/specialEvents'));
app.use('/api/signal-groups',           require('./routes/signalGroups'));
app.use('/api/communications-cabinets', require('./routes/communicationsCabinets'));
app.use('/api/sensors-health',          require('./routes/sensorsHealth'));
app.use('/api/video-feeds',             require('./routes/videoFeeds'));
app.use('/api/controllers',             require('./routes/controllers'));
app.use('/api/performance-metrics',     require('./routes/performanceMetrics'));
app.use('/api/audit-log',               require('./routes/auditLog'));

// AI routes (16 sub-endpoints + samples + history under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom views (maps + charts)
app.use('/api/custom-views', require('./routes/customViews'));

// Pass 7 — full backlog implementation
// Equity-by-neighborhood operator-curated dataset (backs /api/ai/equity-response-time).
app.use('/api/equity-neighborhoods', require('./routes/equityNeighborhoods'));
// NEEDS-CREDS integration stubs (NTCIP, CAD, V2X, Census) — all return 503 by design.
app.use('/api/integrations',         require('./routes/integrations'));

app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Expose onIncidentCreated for downstream wiring if needed
module.exports = { onIncidentCreated };

async function start(){const result=await pool.query("SELECT to_regclass('public.traffic_optimization_cases') AS workflow_table");if(!result.rows[0].workflow_table)throw new Error('Database migrations are required; run ./scripts/migrate.sh');app.listen(PORT,()=>console.log(`AI Smart-City Traffic Signal API running on http://localhost:${PORT}`));}
start().catch(error=>{console.error('Failed to start server:',error.message);process.exitCode=1;});
