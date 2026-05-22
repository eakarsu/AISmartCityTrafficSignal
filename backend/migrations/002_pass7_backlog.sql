-- Pass 7 — full backlog implementation
-- Adds the equity-by-neighborhood dataset table needed by /api/ai/equity-response-time
-- and by /api/equity-neighborhoods CRUD-ish read surface.

CREATE TABLE IF NOT EXISTS equity_neighborhoods (
  id                            SERIAL PRIMARY KEY,
  neighborhood_id               VARCHAR(50) UNIQUE,
  name                          VARCHAR(200),
  census_tract                  VARCHAR(40),
  population                    INTEGER DEFAULT 0,
  median_household_income       NUMERIC(12, 2),
  pct_low_income                NUMERIC(5, 2),
  pct_no_vehicle                NUMERIC(5, 2),
  pct_senior_65plus             NUMERIC(5, 2),
  pct_disabled                  NUMERIC(5, 2),
  intersection_ids              TEXT,           -- comma-separated INT-### list
  avg_incident_response_minutes NUMERIC(8, 2),  -- denormalised cache, refreshed by AI verb
  notes                         TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equity_neighborhoods_tract
  ON equity_neighborhoods (census_tract);

-- Seed a few illustrative neighborhoods so the equity-response-time verb has
-- something to score against when the operator hasn't loaded a real ACS feed.
INSERT INTO equity_neighborhoods
  (neighborhood_id, name, census_tract, population, median_household_income,
   pct_low_income, pct_no_vehicle, pct_senior_65plus, pct_disabled,
   intersection_ids, avg_incident_response_minutes, notes)
VALUES
  ('NB-001', 'Downtown Core',     '06075-0101', 18400,  78500.00, 18.0,  9.5, 12.0,  8.0, 'INT-001,INT-002,INT-014,INT-015', NULL, 'High ped + transit density'),
  ('NB-002', 'Old Town Heritage', '06075-0107', 12200,  41200.00, 36.0, 28.0, 19.0, 14.0, 'INT-003,INT-013',                 NULL, 'Historically under-served corridor'),
  ('NB-003', 'University',        '06075-0204',  9800,  52100.00, 22.0, 41.0,  6.0,  5.0, 'INT-005,INT-014',                 NULL, 'Heavy student crossings'),
  ('NB-004', 'Hospital District', '06075-0301', 14600,  61300.00, 17.0, 11.0, 22.0, 18.0, 'INT-007,INT-010',                 NULL, 'EMS preempt + senior crossings'),
  ('NB-005', 'Lincoln School',    '06075-0408',  8700,  37400.00, 41.0, 19.0,  8.0,  9.0, 'INT-009',                         NULL, 'K-5 school zone, low-income'),
  ('NB-006', 'Industrial/Port',   '06075-0511',  6200,  44900.00, 29.0, 16.0,  9.0, 11.0, 'INT-011,INT-012',                 NULL, 'Truck progression abuts homes'),
  ('NB-007', 'Airport Approach',  '06075-0612', 10400,  68900.00, 14.0,  8.0, 11.0,  7.0, 'INT-006,INT-012',                 NULL, 'Surge corridor to terminal')
ON CONFLICT (neighborhood_id) DO NOTHING;
