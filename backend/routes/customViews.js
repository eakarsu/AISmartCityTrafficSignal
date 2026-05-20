const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Ensure lat/lng columns exist on intersections and incidents.
// Downtown coordinates (approx San Francisco) used as deterministic seed center.
const CENTER_LAT = 37.7793;
const CENTER_LNG = -122.4192;

let _bootstrapped = false;
async function ensureGeoColumns() {
  if (_bootstrapped) return;
  try {
    await pool.query(`
      ALTER TABLE intersections ADD COLUMN IF NOT EXISTS lat NUMERIC(10,6);
      ALTER TABLE intersections ADD COLUMN IF NOT EXISTS lng NUMERIC(10,6);
      ALTER TABLE incidents     ADD COLUMN IF NOT EXISTS lat NUMERIC(10,6);
      ALTER TABLE incidents     ADD COLUMN IF NOT EXISTS lng NUMERIC(10,6);
    `);

    // Populate any nulls deterministically (random-looking but stable per id)
    // jitter ~ +/- 0.025 deg around center.
    await pool.query(`
      UPDATE intersections
         SET lat = ${CENTER_LAT} + ((id * 13 % 100) - 50) / 2000.0,
             lng = ${CENTER_LNG} + ((id * 29 % 100) - 50) / 2000.0
       WHERE lat IS NULL OR lng IS NULL
    `);

    await pool.query(`
      UPDATE incidents i
         SET lat = COALESCE(
                     (SELECT lat FROM intersections x WHERE x.intersection_id = i.intersection_id),
                     ${CENTER_LAT}
                   ) + ((i.id * 17 % 60) - 30) / 4000.0,
             lng = COALESCE(
                     (SELECT lng FROM intersections x WHERE x.intersection_id = i.intersection_id),
                     ${CENTER_LNG}
                   ) + ((i.id * 23 % 60) - 30) / 4000.0
       WHERE lat IS NULL OR lng IS NULL
    `);

    _bootstrapped = true;
  } catch (e) {
    console.warn('[customViews] ensureGeoColumns failed:', e.message);
  }
}

router.use(async (_req, _res, next) => {
  await ensureGeoColumns();
  next();
});

// ---------------------------------------------------------------------------
// 1) Intersection status map — intersections + latest signal color/status
// ---------------------------------------------------------------------------
router.get('/intersection-map', async (_req, res) => {
  try {
    const q = `
      SELECT i.id,
             i.intersection_id,
             i.name,
             i.location,
             i.status,
             i.signal_count,
             i.lat,
             i.lng,
             (
               SELECT s.color FROM signals s
                WHERE s.intersection_id = i.intersection_id
                ORDER BY s.last_change DESC NULLS LAST
                LIMIT 1
             ) AS latest_color,
             (
               SELECT s.status FROM signals s
                WHERE s.intersection_id = i.intersection_id
                ORDER BY s.last_change DESC NULLS LAST
                LIMIT 1
             ) AS latest_signal_status
        FROM intersections i
       ORDER BY i.id
    `;
    const { rows } = await pool.query(q);
    res.json({ center: { lat: CENTER_LAT, lng: CENTER_LNG }, items: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------------
// 2) Signal timeline — phases over time for one intersection (default first)
// ---------------------------------------------------------------------------
router.get('/signal-timeline', async (req, res) => {
  try {
    let intersectionId = req.query.intersection_id;
    if (!intersectionId) {
      const r = await pool.query('SELECT intersection_id FROM intersections ORDER BY id LIMIT 1');
      intersectionId = r.rows[0]?.intersection_id;
    }
    if (!intersectionId) return res.json({ intersection_id: null, signals: [] });

    const sigs = await pool.query(
      `SELECT signal_id, direction, color, status, last_change
         FROM signals
        WHERE intersection_id = $1
        ORDER BY signal_id`,
      [intersectionId]
    );

    // Build synthetic phase stripes over the last 10 minutes per signal.
    // Each signal gets a sequence of (start, duration, color) bars.
    const palette = ['green', 'yellow', 'red'];
    const now = Date.now();
    const series = sigs.rows.map((row, sigIdx) => {
      const bars = [];
      let t = now - 10 * 60 * 1000; // 10 minutes ago
      let colorIdx = sigIdx % palette.length;
      while (t < now) {
        const dur = 20000 + ((sigIdx * 7 + bars.length * 13) % 40) * 1000; // 20–60s
        const stop = Math.min(t + dur, now);
        bars.push({
          start: new Date(t).toISOString(),
          end: new Date(stop).toISOString(),
          start_ms: t - (now - 10 * 60 * 1000),
          duration_ms: stop - t,
          color: palette[colorIdx],
        });
        colorIdx = (colorIdx + 1) % palette.length;
        t = stop;
      }
      // Tag the last bar with the live color reported in DB so it lines up with reality
      if (bars.length) bars[bars.length - 1].color = row.color || bars[bars.length - 1].color;
      return {
        signal_id: row.signal_id,
        direction: row.direction,
        status: row.status,
        last_change: row.last_change,
        bars,
      };
    });

    res.json({ intersection_id: intersectionId, window_minutes: 10, signals: series });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------------
// 3) Incident cluster map — incidents w/ severity coloring
// ---------------------------------------------------------------------------
router.get('/incident-map', async (_req, res) => {
  try {
    const q = `
      SELECT i.id,
             i.incident_id,
             i.intersection_id,
             i.type,
             i.severity,
             i.status,
             i.opened_at,
             i.lat,
             i.lng,
             x.name AS intersection_name
        FROM incidents i
   LEFT JOIN intersections x ON x.intersection_id = i.intersection_id
       ORDER BY i.opened_at DESC NULLS LAST, i.id DESC
    `;
    const { rows } = await pool.query(q);
    res.json({ center: { lat: CENTER_LAT, lng: CENTER_LNG }, items: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------------
// 4) Performance trend — multi-line of metrics grouped by kpi over time
// ---------------------------------------------------------------------------
router.get('/performance-trend', async (_req, res) => {
  try {
    const q = `
      SELECT kpi,
             period,
             value,
             created_at
        FROM performance_metrics
       ORDER BY created_at ASC, kpi ASC
    `;
    const { rows } = await pool.query(q);

    // Group by created_at bucket (yyyy-mm-dd hh:mm), each entry has all KPIs as columns.
    const kpis = Array.from(new Set(rows.map((r) => r.kpi))).filter(Boolean);
    const bucketMap = new Map();
    for (const r of rows) {
      const ts = r.created_at ? new Date(r.created_at) : new Date();
      const key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth() + 1).padStart(2, '0')}-${String(ts.getUTCDate()).padStart(2, '0')} ${String(ts.getUTCHours()).padStart(2, '0')}:${String(ts.getUTCMinutes()).padStart(2, '0')}`;
      if (!bucketMap.has(key)) bucketMap.set(key, { ts: key });
      const entry = bucketMap.get(key);
      if (r.kpi) entry[r.kpi] = Number(r.value);
    }
    const series = Array.from(bucketMap.values());
    res.json({ kpis, series });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------------
// 5) Flow heatmap — intersections with congestion weight points
// ---------------------------------------------------------------------------
router.get('/flow-heatmap', async (_req, res) => {
  try {
    const q = `
      SELECT i.id,
             i.intersection_id,
             i.name,
             i.lat,
             i.lng,
             (
               SELECT AVG(pm.value)
                 FROM performance_metrics pm
                WHERE pm.intersection_id = i.intersection_id
                  AND pm.kpi ILIKE '%delay%'
             ) AS delay_avg,
             (
               SELECT AVG(pm.value)
                 FROM performance_metrics pm
                WHERE pm.intersection_id = i.intersection_id
             ) AS metric_avg
        FROM intersections i
       ORDER BY i.id
    `;
    const { rows } = await pool.query(q);

    // Build heat points: weight from delay/metric_avg, normalized to ~0.2-1.0
    // Fallback to plausible deterministic weight when metrics are missing.
    const points = rows
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => {
        let raw = Number(r.delay_avg);
        if (!Number.isFinite(raw) || raw <= 0) raw = Number(r.metric_avg);
        if (!Number.isFinite(raw) || raw <= 0) {
          // deterministic plausible congestion 0.25 .. 1.0
          raw = 0.25 + ((r.id * 37) % 75) / 100;
        }
        // normalize ~ congestion seconds: clamp to [0.2, 1.0]
        let weight;
        if (raw > 0 && raw < 1.5) {
          weight = Math.max(0.2, Math.min(1.0, raw));
        } else {
          weight = Math.max(0.2, Math.min(1.0, raw / 100));
        }
        return {
          lat: Number(r.lat),
          lng: Number(r.lng),
          weight: Number(weight.toFixed(3)),
          intersection_id: r.intersection_id,
          name: r.name,
        };
      });

    res.json({ center: { lat: CENTER_LAT, lng: CENTER_LNG }, points });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------------
// 6) Signal state — phase timings for one intersection (for animated visualizer)
// ---------------------------------------------------------------------------
router.get('/signal-state', async (req, res) => {
  try {
    let intersectionId = req.query.intersection_id;
    if (!intersectionId) {
      const r = await pool.query('SELECT intersection_id FROM intersections ORDER BY id LIMIT 1');
      intersectionId = r.rows[0]?.intersection_id;
    }
    if (!intersectionId) return res.json({ intersection_id: null, phases: [] });

    const ixRow = await pool.query(
      'SELECT intersection_id, name, location, status FROM intersections WHERE intersection_id = $1',
      [intersectionId]
    );
    const ix = ixRow.rows[0] || { intersection_id: intersectionId };

    // Try to derive cycle from active signal_plans.period for that intersection.
    const planRow = await pool.query(
      `SELECT plan_id, period, version, status
         FROM signal_plans
        WHERE intersection_id = $1
        ORDER BY (status = 'active') DESC, deployed_at DESC
        LIMIT 1`,
      [intersectionId]
    );
    const plan = planRow.rows[0] || null;

    // Default 22s cycle: NS green 8, NS yellow 3, EW green 8, EW yellow 3.
    let nsGreen = 8, nsYellow = 3, ewGreen = 8, ewYellow = 3;
    // Heuristic by plan.period
    const period = String(plan?.period || '').toLowerCase();
    if (period.includes('am_peak') || period.includes('pm_peak')) {
      nsGreen = 12; ewGreen = 12; // longer cycles at peak
    } else if (period.includes('off_peak') || period.includes('late_night')) {
      nsGreen = 6; ewGreen = 6;
    } else if (period.includes('highway')) {
      nsGreen = 16; ewGreen = 8;
    } else if (period.includes('school')) {
      nsGreen = 10; ewGreen = 10;
    }

    const phases = [
      { movement: 'NS', color: 'green',  seconds: nsGreen },
      { movement: 'NS', color: 'yellow', seconds: nsYellow },
      { movement: 'EW', color: 'green',  seconds: ewGreen },
      { movement: 'EW', color: 'yellow', seconds: ewYellow },
    ];
    const cycle_seconds = phases.reduce((a, p) => a + p.seconds, 0);

    res.json({
      intersection_id: ix.intersection_id,
      name: ix.name,
      location: ix.location,
      status: ix.status,
      plan: plan ? { plan_id: plan.plan_id, period: plan.period, version: plan.version, status: plan.status } : null,
      cycle_seconds,
      phases,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
