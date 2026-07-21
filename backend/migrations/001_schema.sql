-- AISmartCityTrafficSignal — core schema (18 entities + RBAC + ai_results + attachments + notifications + webhooks)

-- ─────────────────────────────────────────────
-- RBAC
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  name            VARCHAR(120),
  role            VARCHAR(20) DEFAULT 'viewer',  -- admin|ops|viewer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);

-- ─────────────────────────────────────────────
-- AI results
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);

-- ─────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER,
  title           VARCHAR(200),
  body            TEXT,
  severity        VARCHAR(20) DEFAULT 'info',
  source          VARCHAR(80),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read_at);

-- ─────────────────────────────────────────────
-- Attachments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id              SERIAL PRIMARY KEY,
  resource_type   VARCHAR(60),
  resource_id     INTEGER,
  filename        VARCHAR(255),
  original_name   VARCHAR(255),
  mimetype        VARCHAR(120),
  size_bytes      INTEGER,
  uploaded_by     VARCHAR(150),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_resource
  ON attachments (resource_type, resource_id);

-- ─────────────────────────────────────────────
-- Webhooks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120),
  url             VARCHAR(500),
  secret          VARCHAR(120),
  events          TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              SERIAL PRIMARY KEY,
  webhook_id      INTEGER,
  event           VARCHAR(120),
  payload         JSONB,
  status_code     INTEGER,
  response_body   TEXT,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON webhook_deliveries (webhook_id, attempted_at DESC);

-- ─────────────────────────────────────────────
-- 18 domain tables
-- ─────────────────────────────────────────────

-- 1. intersections
CREATE TABLE IF NOT EXISTS intersections (
  id              SERIAL PRIMARY KEY,
  intersection_id VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  location        VARCHAR(200),
  signal_count    INTEGER DEFAULT 0,
  last_retimed    DATE,
  status          VARCHAR(30) DEFAULT 'operational',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. signals
CREATE TABLE IF NOT EXISTS signals (
  id              SERIAL PRIMARY KEY,
  signal_id       VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  direction       VARCHAR(40),
  color           VARCHAR(20),
  last_change     TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'normal',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. detectors
CREATE TABLE IF NOT EXISTS detectors (
  id              SERIAL PRIMARY KEY,
  detector_id     VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  type            VARCHAR(40),
  lane            VARCHAR(40),
  last_event      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. signal_plans
CREATE TABLE IF NOT EXISTS signal_plans (
  id              SERIAL PRIMARY KEY,
  plan_id         VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  period          VARCHAR(40),
  version         VARCHAR(40),
  deployed_at     TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'draft',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. incidents
CREATE TABLE IF NOT EXISTS incidents (
  id              SERIAL PRIMARY KEY,
  incident_id     VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  type            VARCHAR(60),
  severity        VARCHAR(20) DEFAULT 'medium',
  opened_at       TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. transit_priorities
CREATE TABLE IF NOT EXISTS transit_priorities (
  id              SERIAL PRIMARY KEY,
  priority_id     VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  route           VARCHAR(80),
  vehicle_type    VARCHAR(40),
  status          VARCHAR(30) DEFAULT 'enabled',
  last_used       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. emergency_preemptions
CREATE TABLE IF NOT EXISTS emergency_preemptions (
  id              SERIAL PRIMARY KEY,
  preempt_id      VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  vehicle         VARCHAR(80),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. pedestrian_phases
CREATE TABLE IF NOT EXISTS pedestrian_phases (
  id              SERIAL PRIMARY KEY,
  phase_id        VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  walk_seconds    INTEGER DEFAULT 7,
  flash_seconds   INTEGER DEFAULT 18,
  status          VARCHAR(30) DEFAULT 'active',
  last_event      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. bike_phases
CREATE TABLE IF NOT EXISTS bike_phases (
  id                 SERIAL PRIMARY KEY,
  phase_id           VARCHAR(50) UNIQUE,
  intersection_id    VARCHAR(50),
  duration_seconds   INTEGER DEFAULT 12,
  conflict_movements VARCHAR(200),
  status             VARCHAR(30) DEFAULT 'active',
  last_event         TIMESTAMPTZ,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 10. work_zones
CREATE TABLE IF NOT EXISTS work_zones (
  id              SERIAL PRIMARY KEY,
  zone_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  location        VARCHAR(200),
  started_at      TIMESTAMPTZ,
  expected_end    TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 11. special_events
CREATE TABLE IF NOT EXISTS special_events (
  id                  SERIAL PRIMARY KEY,
  event_id            VARCHAR(50) UNIQUE,
  name                VARCHAR(200),
  location            VARCHAR(200),
  expected_attendance INTEGER DEFAULT 0,
  started_at          TIMESTAMPTZ,
  status              VARCHAR(30) DEFAULT 'scheduled',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 12. signal_groups
CREATE TABLE IF NOT EXISTS signal_groups (
  id                  SERIAL PRIMARY KEY,
  group_id            VARCHAR(50) UNIQUE,
  name                VARCHAR(200),
  intersections_count INTEGER DEFAULT 0,
  coordinator         VARCHAR(120),
  status              VARCHAR(30) DEFAULT 'active',
  mode                VARCHAR(40),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 13. communications_cabinets
CREATE TABLE IF NOT EXISTS communications_cabinets (
  id              SERIAL PRIMARY KEY,
  cabinet_id      VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  vendor          VARCHAR(80),
  last_check      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'healthy',
  ip_address      VARCHAR(40),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 14. sensors_health
CREATE TABLE IF NOT EXISTS sensors_health (
  id              SERIAL PRIMARY KEY,
  health_id       VARCHAR(50) UNIQUE,
  sensor_id       VARCHAR(50),
  status          VARCHAR(30) DEFAULT 'ok',
  last_signal     TIMESTAMPTZ,
  battery_pct     INTEGER DEFAULT 100,
  ts              TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 15. video_feeds
CREATE TABLE IF NOT EXISTS video_feeds (
  id              SERIAL PRIMARY KEY,
  feed_id         VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  camera_id       VARCHAR(50),
  stream_url      VARCHAR(500),
  status          VARCHAR(30) DEFAULT 'streaming',
  last_image      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 16. controllers
CREATE TABLE IF NOT EXISTS controllers (
  id              SERIAL PRIMARY KEY,
  controller_id   VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  vendor          VARCHAR(80),
  firmware        VARCHAR(60),
  last_event      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'online',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 17. performance_metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id              SERIAL PRIMARY KEY,
  metric_id       VARCHAR(50) UNIQUE,
  intersection_id VARCHAR(50),
  kpi             VARCHAR(80),
  value           NUMERIC(12, 3),
  period          VARCHAR(40),
  target          NUMERIC(12, 3),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 18. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(120),
  target          VARCHAR(200),
  action          VARCHAR(80),
  result          VARCHAR(40),
  ts              TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
