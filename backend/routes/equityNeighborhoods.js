// Pass 7 — equity-by-neighborhood dataset.
// Operator-curated table (NEEDS-CREDS for live Census/ACS feed; see
// /api/integrations/census/acs). Backs /api/ai/equity-response-time.

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM equity_neighborhoods ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM equity_neighborhoods WHERE id = $1 OR neighborhood_id = $1 LIMIT 1',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const FIELDS = [
  'neighborhood_id', 'name', 'census_tract', 'population',
  'median_household_income', 'pct_low_income', 'pct_no_vehicle',
  'pct_senior_65plus', 'pct_disabled', 'intersection_ids',
  'avg_incident_response_minutes', 'notes',
];

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const cols = FIELDS.filter((f) => body[f] !== undefined);
    if (!cols.length) return res.status(400).json({ error: 'no recognised fields' });
    const values = cols.map((c) => body[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
    const q = `INSERT INTO equity_neighborhoods (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;
    const r = await pool.query(q, values);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const cols = FIELDS.filter((f) => body[f] !== undefined);
    if (!cols.length) return res.status(400).json({ error: 'no recognised fields' });
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const values = cols.map((c) => body[c]);
    values.push(req.params.id);
    const q = `UPDATE equity_neighborhoods SET ${sets}, updated_at = NOW()
                 WHERE id::text = $${values.length} OR neighborhood_id = $${values.length}
                 RETURNING *`;
    const r = await pool.query(q, values);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM equity_neighborhoods WHERE id::text = $1 OR neighborhood_id = $1 RETURNING id',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
