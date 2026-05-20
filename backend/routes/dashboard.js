const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      intersections, signals, detectors, plans, incidents,
      tsp, preempts, ped, bike, zones, events, groups,
      cabs, sensors, feeds, ctrls, metrics, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='operational') AS operational, COUNT(*) FILTER (WHERE status='degraded') AS degraded, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM intersections"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='fault') AS fault, COUNT(*) FILTER (WHERE status='preempt') AS preempt FROM signals"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='offline' OR status='fault') AS down FROM detectors"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='staged') AS staged FROM signal_plans"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical' OR severity='high') AS high FROM incidents"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='enabled') AS enabled FROM transit_priorities"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM emergency_preemptions"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM pedestrian_phases"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM bike_phases"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='planned') AS planned FROM work_zones"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled FROM special_events"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM signal_groups"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='healthy') AS healthy, COUNT(*) FILTER (WHERE status='offline' OR status='unreachable') AS down FROM communications_cabinets"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='ok') AS ok, COUNT(*) FILTER (WHERE status='fault' OR status='offline' OR status='degraded') AS impaired FROM sensors_health"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='streaming') AS streaming, COUNT(*) FILTER (WHERE status='offline') AS offline FROM video_feeds"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='online') AS online, COUNT(*) FILTER (WHERE status='offline' OR status='degraded') AS impaired FROM controllers"),
      pool.query("SELECT COUNT(*) AS total FROM performance_metrics"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);
    res.json({
      intersections: intersections.rows[0],
      signals: signals.rows[0],
      detectors: detectors.rows[0],
      signal_plans: plans.rows[0],
      incidents: incidents.rows[0],
      transit_priorities: tsp.rows[0],
      emergency_preemptions: preempts.rows[0],
      pedestrian_phases: ped.rows[0],
      bike_phases: bike.rows[0],
      work_zones: zones.rows[0],
      special_events: events.rows[0],
      signal_groups: groups.rows[0],
      communications_cabinets: cabs.rows[0],
      sensors_health: sensors.rows[0],
      video_feeds: feeds.rows[0],
      controllers: ctrls.rows[0],
      performance_metrics: metrics.rows[0],
      audit_log: audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
