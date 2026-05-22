// Pass 7 — unauthenticated public dashboard surface.
// PRODUCT DECISION: only safe, aggregate, non-PII fields are exposed.
// No incident details. No camera URLs. No controller / cabinet ids.
// Mounted BEFORE the global Bearer-token middleware in server.js.

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Lightweight in-process cache so anonymous spam doesn't hammer DB.
let CACHE = { at: 0, body: null };
const CACHE_TTL_MS = 30 * 1000;

router.get('/', async (req, res) => {
  try {
    if (CACHE.body && Date.now() - CACHE.at < CACHE_TTL_MS) {
      return res.json(CACHE.body);
    }
    const [ints, signals, incidents, plans, events, zones] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='operational') AS operational, COUNT(*) FILTER (WHERE status='degraded') AS degraded FROM intersections"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='fault') AS fault FROM signals"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='open' AND (severity='high' OR severity='critical')) AS major_open FROM incidents"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='active') AS active FROM signal_plans"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='scheduled') AS scheduled FROM special_events"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='active') AS active FROM work_zones"),
    ]);
    const total = Number(ints.rows[0].total) || 0;
    const operational = Number(ints.rows[0].operational) || 0;
    const body = {
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: CACHE_TTL_MS / 1000,
      network_health: {
        intersections_total: total,
        intersections_operational: operational,
        intersections_degraded: Number(ints.rows[0].degraded) || 0,
        operational_pct: total ? Math.round((operational * 100) / total) : 0,
      },
      signals: {
        total: Number(signals.rows[0].total) || 0,
        fault: Number(signals.rows[0].fault) || 0,
      },
      active_major_incidents: Number(incidents.rows[0].major_open) || 0,
      active_signal_plans: Number(plans.rows[0].active) || 0,
      scheduled_special_events: Number(events.rows[0].scheduled) || 0,
      active_work_zones: Number(zones.rows[0].active) || 0,
      disclaimer:
        'Aggregate, non-PII operational summary. Refreshed every 30s. ' +
        'For real-time incident maps please contact 311 or the city traffic management center.',
    };
    CACHE = { at: Date.now(), body };
    res.json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public neighborhood equity readout — names + bands only, no demographic
// detail (those live on the authenticated /api/equity-neighborhoods).
router.get('/equity-snapshot', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT neighborhood_id, name, avg_incident_response_minutes
         FROM equity_neighborhoods
         ORDER BY name ASC`
    );
    const rows = r.rows.map((row) => ({
      neighborhood_id: row.neighborhood_id,
      name: row.name,
      avg_response_minutes:
        row.avg_incident_response_minutes != null ? Number(row.avg_incident_response_minutes) : null,
    }));
    res.json({
      generated_at: new Date().toISOString(),
      neighborhoods: rows,
      disclaimer: 'Aggregate response-time averages. Demographic detail is not exposed on the public surface.',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
