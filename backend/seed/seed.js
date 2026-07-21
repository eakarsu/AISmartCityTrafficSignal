const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') throw new Error('Set ALLOW_DESTRUCTIVE_SEED=true to run the destructive seed explicitly');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const demoFallback = process.env.ALLOW_DEMO_SEED === 'true' && process.env.NODE_ENV !== 'production'
  ? process.env.DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD
  : '';
const seedPasswords = ['SEED_ADMIN_PASSWORD','SEED_OPS_PASSWORD','SEED_VIEWER_PASSWORD'].map((name) => {
  const password = process.env[name] || demoFallback;
  if (!password || password.length < 12) throw new Error(`${name} must contain at least 12 characters`);
  return password;
});
const scrypt = promisify(crypto.scrypt);
async function encodePassword(password) { const salt=crypto.randomBytes(16).toString('hex'); const hash=await scrypt(password,salt,64); return `$scrypt$${salt}$${hash.toString('hex')}`; }

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS intersections           CASCADE;
      DROP TABLE IF EXISTS signals                 CASCADE;
      DROP TABLE IF EXISTS detectors               CASCADE;
      DROP TABLE IF EXISTS signal_plans            CASCADE;
      DROP TABLE IF EXISTS incidents               CASCADE;
      DROP TABLE IF EXISTS transit_priorities      CASCADE;
      DROP TABLE IF EXISTS emergency_preemptions   CASCADE;
      DROP TABLE IF EXISTS pedestrian_phases       CASCADE;
      DROP TABLE IF EXISTS bike_phases             CASCADE;
      DROP TABLE IF EXISTS work_zones              CASCADE;
      DROP TABLE IF EXISTS special_events          CASCADE;
      DROP TABLE IF EXISTS signal_groups           CASCADE;
      DROP TABLE IF EXISTS communications_cabinets CASCADE;
      DROP TABLE IF EXISTS sensors_health          CASCADE;
      DROP TABLE IF EXISTS video_feeds             CASCADE;
      DROP TABLE IF EXISTS controllers             CASCADE;
      DROP TABLE IF EXISTS performance_metrics     CASCADE;
      DROP TABLE IF EXISTS audit_log               CASCADE;

      DROP TABLE IF EXISTS users                CASCADE;
      DROP TABLE IF EXISTS ai_results           CASCADE;
      DROP TABLE IF EXISTS notifications        CASCADE;
      DROP TABLE IF EXISTS attachments          CASCADE;
      DROP TABLE IF EXISTS webhooks             CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries   CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema);

    // ─── Users (3) ───────────────────────────
    console.log('[seed] inserting users...');
    const users = [
      [process.env.ADMIN_EMAIL || process.env.DEMO_EMAIL || 'admin@trafficsignal.invalid', await encodePassword(seedPasswords[0]), 'Traffic Admin', 'admin'],
      ['ops@trafficsignal.invalid',    await encodePassword(seedPasswords[1]), 'Signals Ops',   'ops'],
      ['viewer@trafficsignal.invalid', await encodePassword(seedPasswords[2]), 'Traffic Viewer','viewer'],
    ];
    for (const u of users) {
      await client.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        u
      );
    }

    // ─── intersections (15) ──────────────────
    console.log('[seed] inserting intersections...');
    const intersections = [
      ['INT-001', 'Market St & Main St',          'Downtown Core',          12, '2026-04-12', 'operational'],
      ['INT-002', '5th Ave & Broadway',           'Midtown',                10, '2026-03-22', 'operational'],
      ['INT-003', 'Riverside Blvd & Park Dr',     'Riverside',               8, '2026-02-10', 'operational'],
      ['INT-004', 'Industrial Pkwy & Cargo Way',  'Port District',           6, '2026-04-30', 'operational'],
      ['INT-005', 'University Ave & Campus Loop', 'University Quarter',     10, '2026-04-05', 'degraded'],
      ['INT-006', 'Airport Rd & Terminal Dr',     'Airport Approach',       14, '2026-04-18', 'operational'],
      ['INT-007', 'Hospital Way & Emergency Ln',  'Medical District',        8, '2026-03-30', 'operational'],
      ['INT-008', 'Stadium Blvd & Arena Pl',      'Stadium District',       12, '2026-01-20', 'operational'],
      ['INT-009', 'School St & Crossing Way',     'School Zone — Lincoln',   6, '2026-04-22', 'operational'],
      ['INT-010', 'Transit Hub & Bus Plaza',      'Central Transit Hub',    16, '2026-04-08', 'operational'],
      ['INT-011', 'Harbor Dr & Wharf St',         'Harbor District',         8, '2026-02-25', 'maintenance'],
      ['INT-012', 'Highway 101 Off-ramp & Elm',   'Highway Interchange',    10, '2026-03-15', 'operational'],
      ['INT-013', 'Greenway & Bike Path',         'Greenway Corridor',       6, '2026-04-14', 'operational'],
      ['INT-014', 'Civic Center & Hall Ave',      'Civic Center',           10, '2026-04-01', 'operational'],
      ['INT-015', 'Old Town Plaza & Heritage Rd', 'Historic Old Town',       8, '2026-03-08', 'operational'],
    ];
    for (const r of intersections) {
      await client.query(
        'INSERT INTO intersections (intersection_id,name,location,signal_count,last_retimed,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── signals (15) ────────────────────────
    console.log('[seed] inserting signals...');
    const signals = [
      ['SIG-0001', 'INT-001', 'NB', 'green',  '2026-05-17T10:01:12Z', 'normal'],
      ['SIG-0002', 'INT-001', 'SB', 'red',    '2026-05-17T10:01:12Z', 'normal'],
      ['SIG-0003', 'INT-002', 'EB', 'yellow', '2026-05-17T10:01:50Z', 'normal'],
      ['SIG-0004', 'INT-002', 'WB', 'red',    '2026-05-17T10:01:50Z', 'normal'],
      ['SIG-0005', 'INT-003', 'NB', 'green',  '2026-05-17T10:02:02Z', 'normal'],
      ['SIG-0006', 'INT-004', 'EB', 'flash',  '2026-05-17T09:55:00Z', 'fault'],
      ['SIG-0007', 'INT-005', 'SB', 'red',    '2026-05-17T10:00:30Z', 'normal'],
      ['SIG-0008', 'INT-006', 'NB', 'green',  '2026-05-17T10:02:18Z', 'normal'],
      ['SIG-0009', 'INT-007', 'WB', 'green',  '2026-05-17T10:02:21Z', 'preempt'],
      ['SIG-0010', 'INT-008', 'EB', 'red',    '2026-05-17T10:01:55Z', 'normal'],
      ['SIG-0011', 'INT-009', 'NB', 'yellow', '2026-05-17T10:02:30Z', 'normal'],
      ['SIG-0012', 'INT-010', 'SB', 'green',  '2026-05-17T10:02:33Z', 'transit_priority'],
      ['SIG-0013', 'INT-011', 'EB', 'dark',   '2026-05-17T09:50:00Z', 'fault'],
      ['SIG-0014', 'INT-012', 'WB', 'green',  '2026-05-17T10:02:40Z', 'normal'],
      ['SIG-0015', 'INT-013', 'NB', 'green',  '2026-05-17T10:02:45Z', 'normal'],
    ];
    for (const r of signals) {
      await client.query(
        'INSERT INTO signals (signal_id,intersection_id,direction,color,last_change,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── detectors (15) ──────────────────────
    console.log('[seed] inserting detectors...');
    const detectors = [
      ['DET-0001', 'INT-001', 'loop',           'NB-thru',  '2026-05-17T10:02:51Z', 'active'],
      ['DET-0002', 'INT-001', 'video',          'SB-left',  '2026-05-17T10:02:48Z', 'active'],
      ['DET-0003', 'INT-002', 'radar',          'EB-thru',  '2026-05-17T10:02:50Z', 'active'],
      ['DET-0004', 'INT-003', 'loop',           'NB-thru',  '2026-05-17T10:02:33Z', 'active'],
      ['DET-0005', 'INT-004', 'video',          'EB-thru',  '2026-05-17T09:58:00Z', 'offline'],
      ['DET-0006', 'INT-005', 'pedestrian',     'crosswalk','2026-05-17T10:01:10Z', 'active'],
      ['DET-0007', 'INT-006', 'radar',          'NB-thru',  '2026-05-17T10:02:55Z', 'active'],
      ['DET-0008', 'INT-007', 'EMS_transponder','any',      '2026-05-17T10:02:22Z', 'active'],
      ['DET-0009', 'INT-008', 'loop',           'EB-left',  '2026-05-17T10:02:51Z', 'active'],
      ['DET-0010', 'INT-009', 'pedestrian',     'crosswalk','2026-05-17T10:02:30Z', 'active'],
      ['DET-0011', 'INT-010', 'transit_AVL',    'BRT-lane', '2026-05-17T10:02:34Z', 'active'],
      ['DET-0012', 'INT-011', 'loop',           'EB-thru',  '2026-05-17T09:51:00Z', 'fault'],
      ['DET-0013', 'INT-012', 'radar',          'WB-thru',  '2026-05-17T10:02:42Z', 'active'],
      ['DET-0014', 'INT-013', 'bike',           'NB-bike',  '2026-05-17T10:02:46Z', 'active'],
      ['DET-0015', 'INT-014', 'video',          'NB-thru',  '2026-05-17T10:02:48Z', 'active'],
    ];
    for (const r of detectors) {
      await client.query(
        'INSERT INTO detectors (detector_id,intersection_id,type,lane,last_event,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── signal_plans (15) ───────────────────
    console.log('[seed] inserting signal_plans...');
    const plans = [
      ['PLN-0001', 'INT-001', 'AM_peak',     'v3.2', '2026-05-10T06:00:00Z', 'active'],
      ['PLN-0002', 'INT-001', 'PM_peak',     'v3.2', '2026-05-10T06:00:00Z', 'active'],
      ['PLN-0003', 'INT-001', 'off_peak',    'v3.1', '2026-05-10T06:00:00Z', 'active'],
      ['PLN-0004', 'INT-002', 'AM_peak',     'v2.4', '2026-05-12T06:00:00Z', 'active'],
      ['PLN-0005', 'INT-002', 'PM_peak',     'v2.4', '2026-05-12T06:00:00Z', 'active'],
      ['PLN-0006', 'INT-003', 'AM_peak',     'v1.7', '2026-04-25T06:00:00Z', 'active'],
      ['PLN-0007', 'INT-004', 'off_peak',    'v0.9', '2026-04-30T06:00:00Z', 'active'],
      ['PLN-0008', 'INT-005', 'school_dismissal', 'v2.0', '2026-04-22T06:00:00Z', 'active'],
      ['PLN-0009', 'INT-006', 'late_night',  'v1.5', '2026-05-01T06:00:00Z', 'active'],
      ['PLN-0010', 'INT-007', 'AM_peak',     'v2.1', '2026-05-05T06:00:00Z', 'active'],
      ['PLN-0011', 'INT-008', 'event_load_in','v1.0', '2026-05-15T16:00:00Z','staged'],
      ['PLN-0012', 'INT-009', 'school_arrival','v3.0','2026-04-22T06:00:00Z','active'],
      ['PLN-0013', 'INT-010', 'transit_AM',  'v2.7', '2026-05-08T06:00:00Z', 'active'],
      ['PLN-0014', 'INT-011', 'maintenance', 'v0.5', '2026-05-16T08:00:00Z', 'staged'],
      ['PLN-0015', 'INT-012', 'highway_pulse','v4.0','2026-05-10T06:00:00Z', 'active'],
    ];
    for (const r of plans) {
      await client.query(
        'INSERT INTO signal_plans (plan_id,intersection_id,period,version,deployed_at,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── incidents (15) ──────────────────────
    console.log('[seed] inserting incidents...');
    const incidents = [
      ['INC-0001', 'INT-001', 'minor_collision',         'medium',   '2026-05-17T07:42:00Z', 'open'],
      ['INC-0002', 'INT-002', 'detector_outage',         'medium',   '2026-05-17T08:14:00Z', 'open'],
      ['INC-0003', 'INT-004', 'controller_offline',      'high',     '2026-05-17T08:25:00Z', 'open'],
      ['INC-0004', 'INT-005', 'pedestrian_complaint',    'low',      '2026-05-17T09:00:00Z', 'investigating'],
      ['INC-0005', 'INT-006', 'flooded_intersection',    'high',     '2026-05-17T05:50:00Z', 'closed'],
      ['INC-0006', 'INT-008', 'crowd_overflow',          'medium',   '2026-05-16T22:30:00Z', 'closed'],
      ['INC-0007', 'INT-009', 'school_zone_speeding',    'medium',   '2026-05-17T07:55:00Z', 'investigating'],
      ['INC-0008', 'INT-010', 'transit_delay',           'low',      '2026-05-17T08:10:00Z', 'open'],
      ['INC-0009', 'INT-011', 'cabinet_power_loss',      'critical', '2026-05-17T05:00:00Z', 'open'],
      ['INC-0010', 'INT-012', 'queue_spillback_onto_freeway','high', '2026-05-17T08:20:00Z', 'open'],
      ['INC-0011', 'INT-013', 'bike_lane_intrusion',     'low',      '2026-05-17T09:35:00Z', 'investigating'],
      ['INC-0012', 'INT-014', 'protest_assembly',        'medium',   '2026-05-16T14:00:00Z', 'closed'],
      ['INC-0013', 'INT-015', 'pavement_marking_faded',  'low',      '2026-05-15T10:00:00Z', 'open'],
      ['INC-0014', 'INT-003', 'EMS_preempt_unack',       'medium',   '2026-05-17T08:40:00Z', 'closed'],
      ['INC-0015', 'INT-007', 'left_turn_arrow_dark',    'high',     '2026-05-17T09:50:00Z', 'open'],
    ];
    for (const r of incidents) {
      await client.query(
        'INSERT INTO incidents (incident_id,intersection_id,type,severity,opened_at,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── transit_priorities (15) ─────────────
    console.log('[seed] inserting transit_priorities...');
    const tsp = [
      ['TSP-0001', 'INT-010', 'Route 15 BRT',      'bus',         'enabled',  '2026-05-17T08:32:00Z'],
      ['TSP-0002', 'INT-010', 'Route 22 Express',  'bus',         'enabled',  '2026-05-17T08:40:00Z'],
      ['TSP-0003', 'INT-001', 'Route 7 Local',     'bus',         'enabled',  '2026-05-17T08:11:00Z'],
      ['TSP-0004', 'INT-002', 'Route Streetcar A', 'streetcar',   'enabled',  '2026-05-17T08:05:00Z'],
      ['TSP-0005', 'INT-003', 'Route 41 Local',    'bus',         'disabled', '2026-05-12T09:00:00Z'],
      ['TSP-0006', 'INT-005', 'Campus Shuttle',    'shuttle',     'enabled',  '2026-05-17T08:50:00Z'],
      ['TSP-0007', 'INT-006', 'Airport Express',   'bus',         'enabled',  '2026-05-17T08:25:00Z'],
      ['TSP-0008', 'INT-007', 'Hospital Shuttle',  'shuttle',     'enabled',  '2026-05-17T08:00:00Z'],
      ['TSP-0009', 'INT-008', 'Stadium Shuttle',   'bus',         'event_only','2026-05-15T19:00:00Z'],
      ['TSP-0010', 'INT-009', 'School Bus Route 3','school_bus',  'enabled',  '2026-05-17T07:35:00Z'],
      ['TSP-0011', 'INT-011', 'Ferry Shuttle',     'shuttle',     'enabled',  '2026-05-16T08:00:00Z'],
      ['TSP-0012', 'INT-012', 'Commuter Express',  'bus',         'enabled',  '2026-05-17T08:38:00Z'],
      ['TSP-0013', 'INT-013', 'Greenway Trolley',  'trolley',     'enabled',  '2026-05-17T09:00:00Z'],
      ['TSP-0014', 'INT-014', 'Civic Circulator',  'bus',         'enabled',  '2026-05-17T08:45:00Z'],
      ['TSP-0015', 'INT-015', 'Heritage Trolley',  'trolley',     'enabled',  '2026-05-17T09:20:00Z'],
    ];
    for (const r of tsp) {
      await client.query(
        'INSERT INTO transit_priorities (priority_id,intersection_id,route,vehicle_type,status,last_used) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── emergency_preemptions (15) ──────────
    console.log('[seed] inserting emergency_preemptions...');
    const preempts = [
      ['PRE-0001', 'INT-007', 'Engine 12',  '2026-05-17T08:01:00Z', '2026-05-17T08:03:00Z', 'completed'],
      ['PRE-0002', 'INT-001', 'Medic 4',    '2026-05-17T08:10:30Z', '2026-05-17T08:12:00Z', 'completed'],
      ['PRE-0003', 'INT-002', 'Engine 7',   '2026-05-17T08:20:15Z', '2026-05-17T08:22:00Z', 'completed'],
      ['PRE-0004', 'INT-006', 'Police 21',  '2026-05-17T08:25:45Z', '2026-05-17T08:27:00Z', 'completed'],
      ['PRE-0005', 'INT-004', 'Engine 3',   '2026-05-17T08:35:00Z', '2026-05-17T08:37:30Z', 'completed'],
      ['PRE-0006', 'INT-008', 'Medic 9',    '2026-05-17T08:45:00Z', '2026-05-17T08:47:00Z', 'completed'],
      ['PRE-0007', 'INT-010', 'Engine 14',  '2026-05-17T09:00:00Z', '2026-05-17T09:01:45Z', 'completed'],
      ['PRE-0008', 'INT-003', 'Medic 2',    '2026-05-17T09:05:00Z', null,                   'active'],
      ['PRE-0009', 'INT-005', 'Police 12',  '2026-05-17T09:15:00Z', '2026-05-17T09:16:30Z', 'completed'],
      ['PRE-0010', 'INT-009', 'School Police','2026-05-17T07:48:00Z','2026-05-17T07:49:30Z','completed'],
      ['PRE-0011', 'INT-012', 'Engine 6',   '2026-05-17T09:25:00Z', '2026-05-17T09:27:00Z', 'completed'],
      ['PRE-0012', 'INT-014', 'Medic 11',   '2026-05-17T09:35:00Z', '2026-05-17T09:37:00Z', 'completed'],
      ['PRE-0013', 'INT-011', 'Engine 5',   '2026-05-17T09:45:00Z', null,                   'active'],
      ['PRE-0014', 'INT-015', 'Medic 7',    '2026-05-17T09:55:00Z', '2026-05-17T09:57:00Z', 'completed'],
      ['PRE-0015', 'INT-013', 'Police 33',  '2026-05-17T10:05:00Z', '2026-05-17T10:06:30Z', 'completed'],
    ];
    for (const r of preempts) {
      await client.query(
        'INSERT INTO emergency_preemptions (preempt_id,intersection_id,vehicle,started_at,ended_at,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── pedestrian_phases (15) ──────────────
    console.log('[seed] inserting pedestrian_phases...');
    const ped = [
      ['PED-0001', 'INT-001', 7, 18, 'active',  '2026-05-17T10:01:50Z'],
      ['PED-0002', 'INT-002', 7, 20, 'active',  '2026-05-17T10:00:30Z'],
      ['PED-0003', 'INT-003', 6, 16, 'active',  '2026-05-17T09:59:10Z'],
      ['PED-0004', 'INT-005', 9, 24, 'active',  '2026-05-17T09:58:00Z'],
      ['PED-0005', 'INT-006', 7, 18, 'active',  '2026-05-17T10:01:15Z'],
      ['PED-0006', 'INT-007', 8, 22, 'active',  '2026-05-17T10:02:00Z'],
      ['PED-0007', 'INT-008', 7, 19, 'active',  '2026-05-17T10:02:30Z'],
      ['PED-0008', 'INT-009',12, 28, 'active',  '2026-05-17T07:50:00Z'],
      ['PED-0009', 'INT-010', 8, 22, 'active',  '2026-05-17T10:02:35Z'],
      ['PED-0010', 'INT-011', 7, 18, 'disabled','2026-05-16T20:00:00Z'],
      ['PED-0011', 'INT-012', 6, 16, 'active',  '2026-05-17T10:02:42Z'],
      ['PED-0012', 'INT-013', 7, 18, 'active',  '2026-05-17T10:02:46Z'],
      ['PED-0013', 'INT-014', 9, 24, 'active',  '2026-05-17T10:02:50Z'],
      ['PED-0014', 'INT-015', 7, 18, 'active',  '2026-05-17T10:02:52Z'],
      ['PED-0015', 'INT-004', 7, 18, 'inactive','2026-05-15T11:00:00Z'],
    ];
    for (const r of ped) {
      await client.query(
        'INSERT INTO pedestrian_phases (phase_id,intersection_id,walk_seconds,flash_seconds,status,last_event) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── bike_phases (15) ────────────────────
    console.log('[seed] inserting bike_phases...');
    const bike = [
      ['BIK-0001', 'INT-013', 14, 'EB-thru,NB-left',           'active',  '2026-05-17T10:02:46Z'],
      ['BIK-0002', 'INT-001', 10, 'SB-right',                  'active',  '2026-05-17T10:01:50Z'],
      ['BIK-0003', 'INT-002', 12, 'WB-right',                  'active',  '2026-05-17T10:00:30Z'],
      ['BIK-0004', 'INT-003', 12, 'NB-thru',                   'active',  '2026-05-17T09:59:10Z'],
      ['BIK-0005', 'INT-005', 15, 'NB-thru,SB-right',          'active',  '2026-05-17T09:58:00Z'],
      ['BIK-0006', 'INT-006',  9, 'EB-right',                  'active',  '2026-05-17T10:01:15Z'],
      ['BIK-0007', 'INT-007', 11, 'SB-right',                  'active',  '2026-05-17T10:02:00Z'],
      ['BIK-0008', 'INT-008', 12, 'WB-right',                  'active',  '2026-05-17T10:02:30Z'],
      ['BIK-0009', 'INT-009', 15, 'NB-thru',                   'active',  '2026-05-17T07:50:00Z'],
      ['BIK-0010', 'INT-010', 12, 'EB-thru,WB-thru',           'active',  '2026-05-17T10:02:35Z'],
      ['BIK-0011', 'INT-012', 10, 'WB-right',                  'active',  '2026-05-17T10:02:42Z'],
      ['BIK-0012', 'INT-014', 11, 'NB-right',                  'active',  '2026-05-17T10:02:50Z'],
      ['BIK-0013', 'INT-015', 10, 'EB-right',                  'active',  '2026-05-17T10:02:52Z'],
      ['BIK-0014', 'INT-011', 10, 'SB-right',                  'inactive','2026-05-16T18:00:00Z'],
      ['BIK-0015', 'INT-004', 10, 'NB-right',                  'disabled','2026-05-12T10:00:00Z'],
    ];
    for (const r of bike) {
      await client.query(
        'INSERT INTO bike_phases (phase_id,intersection_id,duration_seconds,conflict_movements,status,last_event) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── work_zones (15) ─────────────────────
    console.log('[seed] inserting work_zones...');
    const zones = [
      ['WZ-0001', 'Market St Repaving',          'Market St 100-300 blk',  '2026-05-12T07:00:00Z', '2026-05-25T17:00:00Z', 'active'],
      ['WZ-0002', 'Broadway Water Main',         '5th-7th Ave',            '2026-05-15T07:00:00Z', '2026-05-22T17:00:00Z', 'active'],
      ['WZ-0003', 'Hospital Way Resurfacing',    'Hospital Way 200-400',   '2026-05-10T07:00:00Z', '2026-05-20T17:00:00Z', 'active'],
      ['WZ-0004', 'Bridge Inspection',           'Riverside Bridge',       '2026-05-17T05:00:00Z', '2026-05-17T18:00:00Z', 'active'],
      ['WZ-0005', 'Sidewalk ADA Upgrade',        'University Ave',         '2026-05-08T07:00:00Z', '2026-06-08T17:00:00Z', 'active'],
      ['WZ-0006', 'Streetcar Track Replace',     '5th Ave',                '2026-05-01T22:00:00Z', '2026-06-15T05:00:00Z', 'active'],
      ['WZ-0007', 'Gas Line Replacement',        'Main St 400-600',        '2026-05-14T07:00:00Z', '2026-05-30T17:00:00Z', 'active'],
      ['WZ-0008', 'Signal Pole Replacement',     'INT-011 Harbor Dr',      '2026-05-16T07:00:00Z', '2026-05-19T17:00:00Z', 'active'],
      ['WZ-0009', 'Bike Lane Painting',          'Greenway',               '2026-05-17T07:00:00Z', '2026-05-18T17:00:00Z', 'active'],
      ['WZ-0010', 'Curb Extension Bulb-out',     'School St 100',          '2026-05-09T07:00:00Z', '2026-05-23T17:00:00Z', 'active'],
      ['WZ-0011', 'Camera Mast Install',         'Airport Rd',             '2026-05-13T07:00:00Z', '2026-05-18T17:00:00Z', 'planned'],
      ['WZ-0012', 'Crosswalk Repaint',           'Civic Center',           '2026-05-16T07:00:00Z', '2026-05-17T17:00:00Z', 'completed'],
      ['WZ-0013', 'Stormwater Repair',           'Industrial Pkwy',        '2026-05-11T07:00:00Z', '2026-05-21T17:00:00Z', 'active'],
      ['WZ-0014', 'Old Town Cobblestone',        'Old Town Plaza',         '2026-05-06T07:00:00Z', '2026-06-30T17:00:00Z', 'active'],
      ['WZ-0015', 'Highway Off-ramp Striping',   'Highway 101 Off-ramp',   '2026-05-18T22:00:00Z', '2026-05-19T05:00:00Z', 'planned'],
    ];
    for (const r of zones) {
      await client.query(
        'INSERT INTO work_zones (zone_id,name,location,started_at,expected_end,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── special_events (15) ─────────────────
    console.log('[seed] inserting special_events...');
    const events = [
      ['EVT-0001', 'Stadium Concert',          'Stadium District',          42000, '2026-05-18T19:00:00Z', 'scheduled'],
      ['EVT-0002', 'Marathon Race',            'Downtown Loop',             25000, '2026-05-25T06:00:00Z', 'scheduled'],
      ['EVT-0003', 'Civic Parade',             'Civic Center to Old Town',  15000, '2026-05-20T10:00:00Z', 'scheduled'],
      ['EVT-0004', 'University Commencement',  'University Quarter',        12000, '2026-05-22T09:00:00Z', 'scheduled'],
      ['EVT-0005', 'Farmers Market',           'Old Town Plaza',             3500, '2026-05-18T08:00:00Z', 'scheduled'],
      ['EVT-0006', 'Stadium NFL Game',         'Stadium District',          68000, '2026-05-19T13:00:00Z', 'scheduled'],
      ['EVT-0007', 'Air Show',                 'Airport Approach',          22000, '2026-05-31T11:00:00Z', 'scheduled'],
      ['EVT-0008', 'Riverside Festival',       'Riverside',                  8000, '2026-05-24T12:00:00Z', 'scheduled'],
      ['EVT-0009', 'Tech Conference',          'Civic Center',               6000, '2026-05-20T08:00:00Z', 'scheduled'],
      ['EVT-0010', 'Stadium Soccer',           'Stadium District',          28000, '2026-05-21T19:30:00Z', 'scheduled'],
      ['EVT-0011', 'Pride Parade',             'Downtown Core',             45000, '2026-06-01T11:00:00Z', 'scheduled'],
      ['EVT-0012', 'School Sports Day',        'School Zone — Lincoln',      1200, '2026-05-23T09:00:00Z', 'scheduled'],
      ['EVT-0013', 'Hospital 5k Run',          'Medical District',           2500, '2026-05-26T07:00:00Z', 'scheduled'],
      ['EVT-0014', 'Harbor Boat Show',         'Harbor District',           18000, '2026-05-28T10:00:00Z', 'scheduled'],
      ['EVT-0015', 'Greenway Bike Race',       'Greenway Corridor',          3200, '2026-05-29T07:00:00Z', 'scheduled'],
    ];
    for (const r of events) {
      await client.query(
        'INSERT INTO special_events (event_id,name,location,expected_attendance,started_at,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── signal_groups (15) ──────────────────
    console.log('[seed] inserting signal_groups...');
    const groups = [
      ['GRP-001', 'Downtown Core Corridor',       8, 'OPS-AM-2',   'active',      'coordinated'],
      ['GRP-002', '5th Ave Streetcar Corridor',   6, 'OPS-AM-1',   'active',      'transit_priority'],
      ['GRP-003', 'Airport Approach',             5, 'OPS-PM-3',   'active',      'pulsed'],
      ['GRP-004', 'Hospital District',            4, 'OPS-AM-3',   'active',      'preempt_ready'],
      ['GRP-005', 'Stadium District',             6, 'OPS-EVT-1',  'standby',     'event_mode'],
      ['GRP-006', 'Highway Off-ramp Cluster',     3, 'OPS-PM-2',   'active',      'queue_protect'],
      ['GRP-007', 'School Zone Lincoln',          3, 'OPS-AM-4',   'active',      'school_arrival'],
      ['GRP-008', 'University Quarter',           5, 'OPS-PM-4',   'active',      'coordinated'],
      ['GRP-009', 'Industrial / Port Cluster',    4, 'OPS-OVN-1',  'active',      'truck_progression'],
      ['GRP-010', 'Greenway Bike Network',        5, 'OPS-AM-5',   'active',      'bike_progression'],
      ['GRP-011', 'Civic Center Loop',            4, 'OPS-AM-2',   'active',      'coordinated'],
      ['GRP-012', 'Harbor District',              3, 'OPS-PM-1',   'maintenance', 'free_run'],
      ['GRP-013', 'Old Town Heritage',            3, 'OPS-AM-3',   'active',      'fixed_time'],
      ['GRP-014', 'Riverside Corridor',           4, 'OPS-PM-3',   'active',      'coordinated'],
      ['GRP-015', 'Transit Hub Plaza',            5, 'OPS-AM-1',   'active',      'transit_priority'],
    ];
    for (const r of groups) {
      await client.query(
        'INSERT INTO signal_groups (group_id,name,intersections_count,coordinator,status,mode) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── communications_cabinets (15) ────────
    console.log('[seed] inserting communications_cabinets...');
    const cabs = [
      ['CAB-001', 'INT-001', 'Econolite',  '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.11'],
      ['CAB-002', 'INT-002', 'Siemens',    '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.12'],
      ['CAB-003', 'INT-003', 'McCain',     '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.13'],
      ['CAB-004', 'INT-004', 'Econolite',  '2026-05-17T07:00:00Z', 'unreachable','10.20.1.14'],
      ['CAB-005', 'INT-005', 'Trafficware','2026-05-17T09:00:00Z', 'healthy',  '10.20.1.15'],
      ['CAB-006', 'INT-006', 'Siemens',    '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.16'],
      ['CAB-007', 'INT-007', 'Econolite',  '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.17'],
      ['CAB-008', 'INT-008', 'McCain',     '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.18'],
      ['CAB-009', 'INT-009', 'Econolite',  '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.19'],
      ['CAB-010', 'INT-010', 'Siemens',    '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.20'],
      ['CAB-011', 'INT-011', 'Econolite',  '2026-05-17T05:00:00Z', 'offline',  '10.20.1.21'],
      ['CAB-012', 'INT-012', 'Trafficware','2026-05-17T09:00:00Z', 'healthy',  '10.20.1.22'],
      ['CAB-013', 'INT-013', 'McCain',     '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.23'],
      ['CAB-014', 'INT-014', 'Siemens',    '2026-05-17T09:00:00Z', 'healthy',  '10.20.1.24'],
      ['CAB-015', 'INT-015', 'Econolite',  '2026-05-17T09:00:00Z', 'degraded', '10.20.1.25'],
    ];
    for (const r of cabs) {
      await client.query(
        'INSERT INTO communications_cabinets (cabinet_id,intersection_id,vendor,last_check,status,ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── sensors_health (15) ─────────────────
    console.log('[seed] inserting sensors_health...');
    const sensors = [
      ['SH-0001', 'DET-0001', 'ok',        '2026-05-17T10:02:51Z', 100, '2026-05-17T10:02:51Z'],
      ['SH-0002', 'DET-0002', 'ok',        '2026-05-17T10:02:48Z', 100, '2026-05-17T10:02:48Z'],
      ['SH-0003', 'DET-0003', 'ok',        '2026-05-17T10:02:50Z', 100, '2026-05-17T10:02:50Z'],
      ['SH-0004', 'DET-0004', 'ok',        '2026-05-17T10:02:33Z',  92, '2026-05-17T10:02:33Z'],
      ['SH-0005', 'DET-0005', 'offline',   '2026-05-17T09:58:00Z',  18, '2026-05-17T09:58:00Z'],
      ['SH-0006', 'DET-0006', 'ok',        '2026-05-17T10:01:10Z',  87, '2026-05-17T10:01:10Z'],
      ['SH-0007', 'DET-0007', 'ok',        '2026-05-17T10:02:55Z',  79, '2026-05-17T10:02:55Z'],
      ['SH-0008', 'DET-0008', 'ok',        '2026-05-17T10:02:22Z',  95, '2026-05-17T10:02:22Z'],
      ['SH-0009', 'DET-0009', 'ok',        '2026-05-17T10:02:51Z',  82, '2026-05-17T10:02:51Z'],
      ['SH-0010', 'DET-0010', 'ok',        '2026-05-17T10:02:30Z',  68, '2026-05-17T10:02:30Z'],
      ['SH-0011', 'DET-0011', 'ok',        '2026-05-17T10:02:34Z',  88, '2026-05-17T10:02:34Z'],
      ['SH-0012', 'DET-0012', 'fault',     '2026-05-17T09:51:00Z',  41, '2026-05-17T09:51:00Z'],
      ['SH-0013', 'DET-0013', 'ok',        '2026-05-17T10:02:42Z',  90, '2026-05-17T10:02:42Z'],
      ['SH-0014', 'DET-0014', 'degraded',  '2026-05-17T10:02:46Z',  31, '2026-05-17T10:02:46Z'],
      ['SH-0015', 'DET-0015', 'ok',        '2026-05-17T10:02:48Z',  77, '2026-05-17T10:02:48Z'],
    ];
    for (const r of sensors) {
      await client.query(
        'INSERT INTO sensors_health (health_id,sensor_id,status,last_signal,battery_pct,ts) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── video_feeds (15) ────────────────────
    console.log('[seed] inserting video_feeds...');
    const feeds = [
      ['VF-0001', 'INT-001', 'CAM-001', 'rtsp://cam.traffic/INT-001/main', 'streaming', '2026-05-17T10:02:51Z'],
      ['VF-0002', 'INT-002', 'CAM-002', 'rtsp://cam.traffic/INT-002/main', 'streaming', '2026-05-17T10:02:48Z'],
      ['VF-0003', 'INT-003', 'CAM-003', 'rtsp://cam.traffic/INT-003/main', 'streaming', '2026-05-17T10:02:33Z'],
      ['VF-0004', 'INT-004', 'CAM-004', 'rtsp://cam.traffic/INT-004/main', 'offline',   '2026-05-17T07:00:00Z'],
      ['VF-0005', 'INT-005', 'CAM-005', 'rtsp://cam.traffic/INT-005/main', 'streaming', '2026-05-17T10:01:10Z'],
      ['VF-0006', 'INT-006', 'CAM-006', 'rtsp://cam.traffic/INT-006/main', 'streaming', '2026-05-17T10:02:55Z'],
      ['VF-0007', 'INT-007', 'CAM-007', 'rtsp://cam.traffic/INT-007/main', 'streaming', '2026-05-17T10:02:22Z'],
      ['VF-0008', 'INT-008', 'CAM-008', 'rtsp://cam.traffic/INT-008/main', 'streaming', '2026-05-17T10:02:51Z'],
      ['VF-0009', 'INT-009', 'CAM-009', 'rtsp://cam.traffic/INT-009/main', 'streaming', '2026-05-17T10:02:30Z'],
      ['VF-0010', 'INT-010', 'CAM-010', 'rtsp://cam.traffic/INT-010/main', 'streaming', '2026-05-17T10:02:34Z'],
      ['VF-0011', 'INT-011', 'CAM-011', 'rtsp://cam.traffic/INT-011/main', 'offline',   '2026-05-17T05:00:00Z'],
      ['VF-0012', 'INT-012', 'CAM-012', 'rtsp://cam.traffic/INT-012/main', 'streaming', '2026-05-17T10:02:42Z'],
      ['VF-0013', 'INT-013', 'CAM-013', 'rtsp://cam.traffic/INT-013/main', 'streaming', '2026-05-17T10:02:46Z'],
      ['VF-0014', 'INT-014', 'CAM-014', 'rtsp://cam.traffic/INT-014/main', 'streaming', '2026-05-17T10:02:50Z'],
      ['VF-0015', 'INT-015', 'CAM-015', 'rtsp://cam.traffic/INT-015/main', 'degraded',  '2026-05-17T10:00:00Z'],
    ];
    for (const r of feeds) {
      await client.query(
        'INSERT INTO video_feeds (feed_id,intersection_id,camera_id,stream_url,status,last_image) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── controllers (15) ────────────────────
    console.log('[seed] inserting controllers...');
    const ctrls = [
      ['CTL-001', 'INT-001', 'Econolite',   'Cobalt 4.1.2',   '2026-05-17T10:02:51Z', 'online'],
      ['CTL-002', 'INT-002', 'Siemens',     'm60 3.2.0',      '2026-05-17T10:02:48Z', 'online'],
      ['CTL-003', 'INT-003', 'McCain',      'OmniLink 2.7',   '2026-05-17T10:02:33Z', 'online'],
      ['CTL-004', 'INT-004', 'Econolite',   'Cobalt 4.0.9',   '2026-05-17T07:00:00Z', 'offline'],
      ['CTL-005', 'INT-005', 'Trafficware', 'V76 2.4',        '2026-05-17T10:01:10Z', 'online'],
      ['CTL-006', 'INT-006', 'Siemens',     'm60 3.2.0',      '2026-05-17T10:02:55Z', 'online'],
      ['CTL-007', 'INT-007', 'Econolite',   'Cobalt 4.1.0',   '2026-05-17T10:02:22Z', 'online'],
      ['CTL-008', 'INT-008', 'McCain',      'OmniLink 2.7',   '2026-05-17T10:02:51Z', 'online'],
      ['CTL-009', 'INT-009', 'Econolite',   'Cobalt 4.1.2',   '2026-05-17T10:02:30Z', 'online'],
      ['CTL-010', 'INT-010', 'Siemens',     'm60 3.2.0',      '2026-05-17T10:02:34Z', 'online'],
      ['CTL-011', 'INT-011', 'Econolite',   'Cobalt 3.9.4',   '2026-05-17T05:00:00Z', 'offline'],
      ['CTL-012', 'INT-012', 'Trafficware', 'V76 2.4',        '2026-05-17T10:02:42Z', 'online'],
      ['CTL-013', 'INT-013', 'McCain',      'OmniLink 2.7',   '2026-05-17T10:02:46Z', 'online'],
      ['CTL-014', 'INT-014', 'Siemens',     'm60 3.2.0',      '2026-05-17T10:02:50Z', 'online'],
      ['CTL-015', 'INT-015', 'Econolite',   'Cobalt 4.0.5',   '2026-05-17T10:02:52Z', 'degraded'],
    ];
    for (const r of ctrls) {
      await client.query(
        'INSERT INTO controllers (controller_id,intersection_id,vendor,firmware,last_event,status) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── performance_metrics (15) ────────────
    console.log('[seed] inserting performance_metrics...');
    const metrics = [
      ['MET-0001', 'INT-001', 'avg_delay_sec',          42.1, 'AM_peak', 35.0],
      ['MET-0002', 'INT-001', 'arrivals_on_green_pct',  72.5, 'AM_peak', 80.0],
      ['MET-0003', 'INT-002', 'avg_delay_sec',          58.7, 'AM_peak', 35.0],
      ['MET-0004', 'INT-003', 'queue_length_ft',       210.0, 'PM_peak',150.0],
      ['MET-0005', 'INT-004', 'split_failure_pct',      18.4, 'PM_peak',  8.0],
      ['MET-0006', 'INT-005', 'ped_actuation_count',   312.0, 'AM_peak',  0.0],
      ['MET-0007', 'INT-006', 'travel_time_sec',       145.2, 'AM_peak',120.0],
      ['MET-0008', 'INT-007', 'preempt_count',           7.0, 'AM_peak',  0.0],
      ['MET-0009', 'INT-008', 'event_queue_clear_min',  22.5, 'event',   15.0],
      ['MET-0010', 'INT-009', 'school_zone_compliance', 88.0, 'arrival', 95.0],
      ['MET-0011', 'INT-010', 'transit_priority_used',  41.0, 'AM_peak', 35.0],
      ['MET-0012', 'INT-011', 'comm_loss_minutes',     180.0, 'daily',    5.0],
      ['MET-0013', 'INT-012', 'spillback_events',        9.0, 'PM_peak',  0.0],
      ['MET-0014', 'INT-013', 'bike_phase_skip_pct',     6.0, 'PM_peak',  0.0],
      ['MET-0015', 'INT-014', 'co2_kg_estimate',       212.0, 'AM_peak',180.0],
    ];
    for (const r of metrics) {
      await client.query(
        'INSERT INTO performance_metrics (metric_id,intersection_id,kpi,value,period,target) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    // ─── audit_log (15) ──────────────────────
    console.log('[seed] inserting audit_log...');
    const audit = [
      ['AUD-0001', 'ops@trafficsignal.io',    'PLN-0001', 'deploy_plan',      'success', '2026-05-17T06:00:00Z'],
      ['AUD-0002', 'admin@trafficsignal.io',  'INT-005',  'retime',           'success', '2026-05-17T07:10:00Z'],
      ['AUD-0003', 'ops@trafficsignal.io',    'PRE-0001', 'preempt_accept',   'success', '2026-05-17T08:01:00Z'],
      ['AUD-0004', 'ops@trafficsignal.io',    'TSP-0009', 'enable',           'success', '2026-05-17T08:30:00Z'],
      ['AUD-0005', 'admin@trafficsignal.io',  'CAB-011',  'restart_attempt',  'failed',  '2026-05-17T05:15:00Z'],
      ['AUD-0006', 'ops@trafficsignal.io',    'WZ-0004',  'open_work_zone',   'success', '2026-05-17T05:00:00Z'],
      ['AUD-0007', 'admin@trafficsignal.io',  'GRP-005',  'event_mode_on',    'success', '2026-05-15T19:00:00Z'],
      ['AUD-0008', 'ops@trafficsignal.io',    'BIK-0001', 'extend_phase',     'success', '2026-05-17T09:45:00Z'],
      ['AUD-0009', 'admin@trafficsignal.io',  'INT-012',  'install_plan',     'success', '2026-05-10T06:00:00Z'],
      ['AUD-0010', 'ops@trafficsignal.io',    'INC-0009', 'open_incident',    'success', '2026-05-17T05:00:00Z'],
      ['AUD-0011', 'viewer@trafficsignal.io', '/intersections','view',        'success', '2026-05-17T08:11:00Z'],
      ['AUD-0012', 'ops@trafficsignal.io',    'CTL-004',  'reboot_attempt',   'failed',  '2026-05-17T07:15:00Z'],
      ['AUD-0013', 'admin@trafficsignal.io',  'TSP-0005', 'disable',          'success', '2026-05-12T09:00:00Z'],
      ['AUD-0014', 'ops@trafficsignal.io',    'INT-008',  'manual_override',  'success', '2026-05-15T20:00:00Z'],
      ['AUD-0015', 'admin@trafficsignal.io',  'GRP-002',  'set_transit_mode', 'success', '2026-05-17T08:00:00Z'],
    ];
    for (const r of audit) {
      await client.query(
        'INSERT INTO audit_log (entry_id,actor,target,action,result,ts) VALUES ($1,$2,$3,$4,$5,$6)',
        r
      );
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
