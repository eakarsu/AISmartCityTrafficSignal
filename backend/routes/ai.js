const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// Sample fills (5 per verb)
// ──────────────────────────────────────────────────────────────
const SAMPLES = {
  'incident-aware-retime': [
    { label: 'Minor collision at Market & Main', values: { incident_id: 'INC-0001', intersection_id: 'INT-001', notes: 'NB-left lane blocked, expect 25 min cleanup' } },
    { label: 'Detector outage at 5th & Broadway', values: { incident_id: 'INC-0002', intersection_id: 'INT-002', notes: 'EB radar detector offline since 0814' } },
    { label: 'Controller offline at Industrial Pkwy', values: { incident_id: 'INC-0003', intersection_id: 'INT-004', notes: 'Cabinet CAB-004 unreachable; signal flashing' } },
    { label: 'Flooded intersection at Airport Rd', values: { incident_id: 'INC-0005', intersection_id: 'INT-006', notes: 'Standing water in SB lanes; reduce service' } },
    { label: 'Queue spillback onto Highway 101', values: { incident_id: 'INC-0010', intersection_id: 'INT-012', notes: 'PM peak spillback risk onto off-ramp' } },
  ],
  'ped-conflict-detect': [
    { label: 'University Ave & Campus Loop',     values: { intersection_id: 'INT-005', notes: 'Heavy student crossings 1015-1115 weekday' } },
    { label: 'Hospital Way & Emergency Ln',      values: { intersection_id: 'INT-007', notes: 'EMS preempts conflicting with senior pedestrian crossings' } },
    { label: 'School St & Crossing Way',         values: { intersection_id: 'INT-009', notes: 'School arrival 0735-0810 — extend walk seconds?' } },
    { label: 'Civic Center & Hall Ave',          values: { intersection_id: 'INT-014', notes: 'Civic Center events spike ped volume' } },
    { label: 'Transit Hub & Bus Plaza',          values: { intersection_id: 'INT-010', notes: 'Bus alighting passengers cross against signal' } },
  ],
  'transit-priority-suggest': [
    { label: 'Route 15 BRT corridor',            values: { route: 'Route 15 BRT', notes: 'AM peak headway 6 min, congestion at INT-002 and INT-010' } },
    { label: 'Route Streetcar A',                values: { route: 'Route Streetcar A', notes: '5th Ave corridor, mixed-traffic stretches' } },
    { label: 'Airport Express',                  values: { route: 'Airport Express', notes: 'Single trip per 20 min, schedule-critical' } },
    { label: 'Campus Shuttle',                   values: { route: 'Campus Shuttle', notes: '4 intersections, frequent stops, equity corridor' } },
    { label: 'Hospital Shuttle',                 values: { route: 'Hospital Shuttle', notes: 'Connects parking garage to ED entrance' } },
  ],
  'work-zone-signal-plan': [
    { label: 'Market St Repaving (WZ-0001)',     values: { zone_id: 'WZ-0001', notes: 'Single-lane closure NB, 13 days, business district' } },
    { label: 'Broadway Water Main (WZ-0002)',    values: { zone_id: 'WZ-0002', notes: 'Full closure 5th-7th, detour via 6th Ave for 7 days' } },
    { label: 'Streetcar Track Replace (WZ-0006)',values: { zone_id: 'WZ-0006', notes: 'Night work 22:00-05:00, 45-day window' } },
    { label: 'Gas Line Replacement (WZ-0007)',   values: { zone_id: 'WZ-0007', notes: 'Lane shifts and shoulder use, 16-day window' } },
    { label: 'Signal Pole Replacement (WZ-0008)',values: { zone_id: 'WZ-0008', notes: 'INT-011 temporarily on portable signals' } },
  ],
  'special-event-signal-plan': [
    { label: 'Stadium Concert (EVT-0001)',       values: { event_id: 'EVT-0001', notes: '42k attendees, load-in 18:00 doors 19:00' } },
    { label: 'Marathon Race (EVT-0002)',         values: { event_id: 'EVT-0002', notes: 'Downtown loop closure 06:00-12:00, 25k runners' } },
    { label: 'Civic Parade (EVT-0003)',          values: { event_id: 'EVT-0003', notes: 'Parade route Civic Center to Old Town, 15k along route' } },
    { label: 'Stadium NFL Game (EVT-0006)',      values: { event_id: 'EVT-0006', notes: '68k attendees, egress 16:30-18:00 critical' } },
    { label: 'Air Show (EVT-0007)',              values: { event_id: 'EVT-0007', notes: 'Airport Approach corridor surge 09:00-15:00' } },
  ],
  'executive-brief': [
    { label: 'Default snapshot — no bias',       values: { notes: '' } },
    { label: 'Bias toward downtown corridor',    values: { notes: 'Focus on Downtown Core Corridor and 5th Ave Streetcar performance during AM peak.' } },
    { label: 'Bias toward equity neighborhoods', values: { notes: 'Focus on University, Hospital and School Zone intersections; highlight ped safety gaps.' } },
    { label: 'Bias toward event readiness',      values: { notes: 'Focus on upcoming Stadium Concert and Marathon Race readiness across affected groups.' } },
    { label: 'Bias toward asset health',         values: { notes: 'Focus on cabinet / controller / sensor health; cite specific offline devices.' } },
  ],
  'signal-health-prognostic': [
    { label: 'Analyze current device fleet (default)', values: {} },
    { label: 'Analyze current device fleet (default)', values: {} },
    { label: 'Analyze current device fleet (default)', values: {} },
    { label: 'Analyze current device fleet (default)', values: {} },
    { label: 'Analyze current device fleet (default)', values: {} },
  ],
  'equity-impact-brief': [
    {
      label: 'New PM transit-priority policy',
      values: {
        policy: 'Add transit signal priority to all Route 15 BRT intersections during PM peak (16:00-19:00).',
        demographics: 'Route 15 corridor crosses three Census tracts with 38% household-no-car rate and 22% population over 65.',
      },
    },
    {
      label: 'Reduce ped Walk seconds downtown',
      values: {
        policy: 'Reduce Walk indication from 9s to 7s at all Downtown Core Corridor intersections to improve vehicle throughput.',
        demographics: 'Downtown Core has 18% senior population, 9% ADA-disabled population; high lunch-hour ped volume.',
      },
    },
    {
      label: 'School zone all-pedestrian phase',
      values: {
        policy: 'Implement exclusive all-pedestrian phase 0730-0810 at School St & Crossing Way (INT-009) during school arrival.',
        demographics: 'Lincoln school zone serves 850 students K-5 from 4 surrounding low-income blocks.',
      },
    },
    {
      label: 'Industrial corridor truck progression',
      values: {
        policy: 'Tune Industrial / Port Cluster (GRP-009) for overnight truck progression at the expense of cross-street traffic.',
        demographics: 'Industrial corridor borders two residential blocks with 2,400 residents and one elementary school.',
      },
    },
    {
      label: 'Civic Center event-mode default',
      values: {
        policy: 'Keep Civic Center Loop in event-mode all weekend even when no event scheduled.',
        demographics: 'Civic Center borders Old Town Heritage low-income residential zone; weekend transit dependence is high.',
      },
    },
  ],
  'emission-impact-estimate': [
    { label: 'Downtown Core Corridor — coordinated timing', values: { corridor: 'Downtown Core Corridor', notes: 'New coordination plan v3.2 deployed 2026-05-10' } },
    { label: '5th Ave Streetcar Corridor — TSP',           values: { corridor: '5th Ave Streetcar Corridor', notes: 'TSP enabled at 6 intersections' } },
    { label: 'Highway Off-ramp Cluster — queue protect',   values: { corridor: 'Highway 101 Off-ramp Cluster', notes: 'Spillback protection plan v4.0' } },
    { label: 'Airport Approach — pulsed mode',             values: { corridor: 'Airport Approach', notes: 'Pulsed mode for arrivals surge' } },
    { label: 'Industrial / Port Cluster — truck progression', values: { corridor: 'Industrial / Port Cluster', notes: 'Overnight truck progression' } },
  ],
  'corridor-coordination': [
    { label: 'Downtown Core Corridor',          values: { corridor: 'Downtown Core Corridor', intersection_ids: 'INT-001,INT-002,INT-014,INT-015' } },
    { label: '5th Ave Streetcar Corridor',      values: { corridor: '5th Ave Streetcar Corridor', intersection_ids: 'INT-002,INT-014,INT-010' } },
    { label: 'Airport Approach',                values: { corridor: 'Airport Approach', intersection_ids: 'INT-006,INT-012' } },
    { label: 'Greenway Bike Network',           values: { corridor: 'Greenway Bike Network', intersection_ids: 'INT-013,INT-003' } },
    { label: 'Hospital District',               values: { corridor: 'Hospital District', intersection_ids: 'INT-007,INT-010' } },
  ],
  'intersection-prioritize': [
    { label: 'Rank current network (default)', values: {} },
    { label: 'Rank current network (default)', values: {} },
    { label: 'Rank current network (default)', values: {} },
    { label: 'Rank current network (default)', values: {} },
    { label: 'Rank current network (default)', values: {} },
  ],
  'citizen-complaint-summary': [
    {
      label: 'Downtown weekly complaint batch',
      values: {
        complaints: '1. Long wait NB at Market & Main, 0830\n2. Walk button at 5th & Broadway not working\n3. Bus stuck at Transit Hub red light 3 cycles\n4. School St crossing too short for kids\n5. Hospital Way left arrow dark again\n6. Airport Rd ped signal flashes when traffic still moving\n7. Civic Center light skips bike phase\n8. Industrial Pkwy stuck on flash since morning\n9. Old Town Plaza beg button broken\n10. Stadium Blvd queue blocks driveway',
      },
    },
    {
      label: 'School zone complaints (Lincoln)',
      values: {
        complaints: '1. School St crossing too short for 1st graders\n2. Cars not stopping for crossing guard\n3. Walk button doesn\'t register\n4. Buses can\'t make left into school',
      },
    },
    {
      label: 'Transit rider complaints',
      values: {
        complaints: '1. Bus held at 5th & Broadway every morning\n2. Streetcar misses green at Transit Hub\n3. Hospital shuttle stuck behind cars at Hospital Way\n4. Campus Shuttle stops in left turn lane\n5. Airport Express late due to detector outage',
      },
    },
    {
      label: 'Bike commuter complaints',
      values: {
        complaints: '1. Greenway light skips bike phase too often\n2. Bike box at INT-001 painted but not signal\n3. Bike detector at INT-013 doesn\'t pick me up',
      },
    },
    {
      label: 'Event-night complaints (stadium)',
      values: {
        complaints: '1. Could not exit lot for 45 min after game\n2. Pedestrians blocked traffic crossing against signal\n3. Stadium Shuttle never came due to congestion\n4. Light kept flashing yellow during egress',
      },
    },
  ],
  'sensor-anomaly': [
    { label: 'Scan current sensor fleet (default)', values: {} },
    { label: 'Scan current sensor fleet (default)', values: {} },
    { label: 'Scan current sensor fleet (default)', values: {} },
    { label: 'Scan current sensor fleet (default)', values: {} },
    { label: 'Scan current sensor fleet (default)', values: {} },
  ],
  'work-order-draft': [
    { label: 'Replace dark left-turn arrow at INT-007', values: { target: 'INT-007 — Hospital Way & Emergency Ln', problem: 'Left-turn arrow indication is dark; bulb or driver module suspected. Reported 0950 by ops.' } },
    { label: 'Reboot offline cabinet CAB-011',          values: { target: 'CAB-011 — INT-011 Harbor Dr & Wharf St', problem: 'Cabinet unreachable since 0500. Site visit needed to verify power and modem.' } },
    { label: 'Restore detector DET-0005 at INT-004',    values: { target: 'DET-0005 — INT-004 video detector', problem: 'Video detector offline since 0958; lens may be dirty or camera POE failed.' } },
    { label: 'Replace flashing signal head at INT-013', values: { target: 'INT-013 — Greenway & Bike Path', problem: 'NB head intermittently flashing red. Conflict-monitor likely tripped.' } },
    { label: 'Repaint crosswalk INT-009',               values: { target: 'INT-009 — School St & Crossing Way', problem: 'School crosswalk markings faded; needs thermoplastic refresh ahead of Monday arrival.' } },
  ],
  'performance-anomaly': [
    { label: 'Scan current KPI sample (default)', values: {} },
    { label: 'Scan current KPI sample (default)', values: {} },
    { label: 'Scan current KPI sample (default)', values: {} },
    { label: 'Scan current KPI sample (default)', values: {} },
    { label: 'Scan current KPI sample (default)', values: {} },
  ],
  'vendor-quality-score': [
    { label: 'Score current vendor mix (default)', values: {} },
    { label: 'Score current vendor mix (default)', values: {} },
    { label: 'Score current vendor mix (default)', values: {} },
    { label: 'Score current vendor mix (default)', values: {} },
    { label: 'Score current vendor mix (default)', values: {} },
  ],
};

// GET /api/ai/samples
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) return res.json({ features: Object.keys(SAMPLES) });
    const samples = SAMPLES[feature];
    if (!samples) return res.status(404).json({ error: `unknown feature: ${feature}` });
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 1. incident-aware-retime
router.post('/incident-aware-retime', async (req, res) => {
  try {
    const { incident_id, intersection_id, notes } = req.body || {};
    let incident = null;
    let intersection = null;
    if (incident_id) {
      const r = await pool.query('SELECT * FROM incidents WHERE incident_id = $1 LIMIT 1', [incident_id]);
      incident = r.rows[0] || null;
    }
    if (!incident && intersection_id) {
      const r = await pool.query(
        "SELECT * FROM incidents WHERE intersection_id = $1 AND status IN ('open','investigating') ORDER BY id DESC LIMIT 1",
        [intersection_id]
      );
      incident = r.rows[0] || null;
    }
    if (!incident) {
      const r = await pool.query("SELECT * FROM incidents WHERE status IN ('open','investigating') ORDER BY id DESC LIMIT 1");
      incident = r.rows[0] || { type: 'unspecified', severity: 'medium', notes };
    }
    if (intersection_id) {
      const r = await pool.query('SELECT * FROM intersections WHERE intersection_id = $1 LIMIT 1', [intersection_id]);
      intersection = r.rows[0] || null;
    }
    const context = { intersection, plans: [], notes };
    const result = await ai.incidentAwareRetime(incident, context);
    await record('incident-aware-retime', { incident_id, intersection_id, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. ped-conflict-detect
router.post('/ped-conflict-detect', async (req, res) => {
  try {
    const { intersection_id, notes } = req.body || {};
    let intersection = null;
    let events = [];
    if (intersection_id) {
      const r = await pool.query('SELECT * FROM intersections WHERE intersection_id = $1 LIMIT 1', [intersection_id]);
      intersection = r.rows[0] || null;
      const ev = await pool.query(
        'SELECT * FROM pedestrian_phases WHERE intersection_id = $1 ORDER BY id DESC LIMIT 10',
        [intersection_id]
      );
      events = ev.rows;
    }
    const result = await ai.pedConflictDetect(intersection || { intersection_id, notes }, events);
    await record('ped-conflict-detect', { intersection_id, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. transit-priority-suggest
router.post('/transit-priority-suggest', async (req, res) => {
  try {
    const { route, notes } = req.body || {};
    if (!route) return res.status(400).json({ error: 'route is required' });
    const r = await pool.query(
      'SELECT * FROM transit_priorities WHERE route ILIKE $1 ORDER BY id DESC LIMIT 20',
      [`%${route}%`]
    );
    const context = r.rows.length ? r.rows : (await pool.query('SELECT * FROM intersections ORDER BY id ASC LIMIT 10')).rows;
    const result = await ai.transitPrioritySuggest(route, { records: context, notes });
    await record('transit-priority-suggest', { route, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. work-zone-signal-plan
router.post('/work-zone-signal-plan', async (req, res) => {
  try {
    const { zone_id, notes } = req.body || {};
    let zone = null;
    if (zone_id) {
      const r = await pool.query('SELECT * FROM work_zones WHERE zone_id = $1 LIMIT 1', [zone_id]);
      zone = r.rows[0] || null;
    }
    if (!zone) {
      const r = await pool.query("SELECT * FROM work_zones WHERE status = 'active' ORDER BY id DESC LIMIT 1");
      zone = r.rows[0] || { zone_id, notes };
    }
    const ints = await pool.query('SELECT * FROM intersections ORDER BY id ASC LIMIT 15');
    const result = await ai.workZoneSignalPlan(zone, ints.rows);
    await record('work-zone-signal-plan', { zone_id, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. special-event-signal-plan
router.post('/special-event-signal-plan', async (req, res) => {
  try {
    const { event_id, notes } = req.body || {};
    let eventRow = null;
    if (event_id) {
      const r = await pool.query('SELECT * FROM special_events WHERE event_id = $1 LIMIT 1', [event_id]);
      eventRow = r.rows[0] || null;
    }
    if (!eventRow) {
      const r = await pool.query("SELECT * FROM special_events WHERE status = 'scheduled' ORDER BY started_at ASC LIMIT 1");
      eventRow = r.rows[0] || { event_id, notes };
    }
    const ints = await pool.query('SELECT * FROM intersections ORDER BY id ASC LIMIT 15');
    const result = await ai.specialEventSignalPlan(eventRow, ints.rows);
    await record('special-event-signal-plan', { event_id, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. executive-brief
router.post('/executive-brief', async (req, res) => {
  try {
    const [intersections, signals, incidents, plans, cabinets] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE status='operational') AS operational, COUNT(*) FILTER (WHERE status='degraded') AS degraded, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance, COUNT(*) AS total FROM intersections"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='fault') AS fault, COUNT(*) AS total FROM signals"),
      pool.query("SELECT COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) AS total FROM incidents"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) AS total FROM signal_plans"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='offline') AS offline, COUNT(*) FILTER (WHERE status='unreachable') AS unreachable, COUNT(*) AS total FROM communications_cabinets"),
    ]);
    const snapshot = {
      intersections: intersections.rows[0],
      signals: signals.rows[0],
      incidents: incidents.rows[0],
      signal_plans: plans.rows[0],
      cabinets: cabinets.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief: result };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. signal-health-prognostic
router.post('/signal-health-prognostic', async (req, res) => {
  try {
    let devices = req.body?.devices;
    if (!devices) {
      const [ctrls, cabs, sensors] = await Promise.all([
        pool.query('SELECT * FROM controllers ORDER BY id ASC LIMIT 15'),
        pool.query('SELECT * FROM communications_cabinets ORDER BY id ASC LIMIT 15'),
        pool.query('SELECT * FROM sensors_health ORDER BY id ASC LIMIT 15'),
      ]);
      devices = { controllers: ctrls.rows, cabinets: cabs.rows, sensors: sensors.rows };
    }
    const result = await ai.signalHealthPrognostic(devices);
    await record('signal-health-prognostic', { devices_summary: 'auto-loaded fleet' }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. equity-impact-brief
router.post('/equity-impact-brief', async (req, res) => {
  try {
    const { policy, demographics } = req.body || {};
    if (!policy) return res.status(400).json({ error: 'policy is required' });
    const result = await ai.equityImpactBrief(policy, demographics || {});
    await record('equity-impact-brief', { policy, demographics }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. emission-impact-estimate
router.post('/emission-impact-estimate', async (req, res) => {
  try {
    const { corridor, notes } = req.body || {};
    if (!corridor) return res.status(400).json({ error: 'corridor is required' });
    const r = await pool.query('SELECT * FROM performance_metrics ORDER BY id DESC LIMIT 15');
    const result = await ai.emissionImpactEstimate(corridor, { metrics: r.rows, notes });
    await record('emission-impact-estimate', { corridor, notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 10. corridor-coordination
router.post('/corridor-coordination', async (req, res) => {
  try {
    const { corridor, intersection_ids } = req.body || {};
    if (!corridor) return res.status(400).json({ error: 'corridor is required' });
    let ints = [];
    if (intersection_ids) {
      const list = String(intersection_ids).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length) {
        const r = await pool.query('SELECT * FROM intersections WHERE intersection_id = ANY($1::varchar[])', [list]);
        ints = r.rows;
      }
    }
    if (!ints.length) {
      const r = await pool.query('SELECT * FROM intersections ORDER BY id ASC LIMIT 8');
      ints = r.rows;
    }
    const result = await ai.corridorCoordination(corridor, ints);
    await record('corridor-coordination', { corridor, intersection_ids }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 11. intersection-prioritize
router.post('/intersection-prioritize', async (req, res) => {
  try {
    let ints = req.body?.intersections;
    if (!ints) {
      const r = await pool.query('SELECT * FROM intersections ORDER BY id ASC LIMIT 20');
      ints = r.rows;
    }
    const result = await ai.intersectionPrioritize(ints);
    await record('intersection-prioritize', { count: ints.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 12. citizen-complaint-summary
router.post('/citizen-complaint-summary', async (req, res) => {
  try {
    const text = (req.body?.complaints || '').toString();
    if (!text) return res.status(400).json({ error: 'complaints (text) is required' });
    const result = await ai.citizenComplaintSummary(text);
    await record('citizen-complaint-summary', { complaints_length: text.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 13. sensor-anomaly
router.post('/sensor-anomaly', async (req, res) => {
  try {
    let samples = req.body?.samples;
    if (!samples) {
      const r = await pool.query('SELECT * FROM sensors_health ORDER BY id ASC LIMIT 30');
      samples = r.rows;
    }
    const result = await ai.sensorAnomaly(samples);
    await record('sensor-anomaly', { samples_count: samples.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 14. work-order-draft
router.post('/work-order-draft', async (req, res) => {
  try {
    const { target, problem } = req.body || {};
    if (!target || !problem) return res.status(400).json({ error: 'target and problem are required' });
    const result = await ai.workOrderDraft(target, problem);
    await record('work-order-draft', { target, problem }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 15. performance-anomaly
router.post('/performance-anomaly', async (req, res) => {
  try {
    let metrics = req.body?.metrics;
    if (!metrics) {
      const r = await pool.query('SELECT * FROM performance_metrics ORDER BY id ASC LIMIT 30');
      metrics = r.rows;
    }
    const result = await ai.performanceAnomaly(metrics);
    await record('performance-anomaly', { metrics_count: metrics.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 16. vendor-quality-score
router.post('/vendor-quality-score', async (req, res) => {
  try {
    let history = req.body?.history;
    if (!history) {
      const [ctrls, cabs, incidents] = await Promise.all([
        pool.query('SELECT vendor, status, firmware FROM controllers'),
        pool.query('SELECT vendor, status FROM communications_cabinets'),
        pool.query('SELECT intersection_id, type, severity, status FROM incidents ORDER BY id DESC LIMIT 30'),
      ]);
      history = { controllers: ctrls.rows, cabinets: cabs.rows, recent_incidents: incidents.rows };
    }
    const result = await ai.vendorQualityScore(history);
    await record('vendor-quality-score', { input_keys: Object.keys(history) }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
