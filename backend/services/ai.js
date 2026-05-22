// AI helper service for AISmartCityTrafficSignal
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');
const path = require('path');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  return { key, model };
}

const SYSTEM_PROMPT =
  'You are a senior smart-city traffic-signal operations analyst supporting a city traffic management center. ' +
  'You provide rigorous, operations-grade reasoning on signal timing, intersection performance, transit priority, ' +
  'pedestrian safety, work zones, incidents, and equity impact. Always return strict JSON in the exact schema requested.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve) => {
    const { key, model } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3088',
        'X-Title': 'AI Smart-City Traffic Signal',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// 1. Incident-aware retime
async function incidentAwareRetime(incident, intersectionContext = {}) {
  const sys = `${SYSTEM_PROMPT} Re-time a signal in response to an incident. Return strict JSON:
{
  "intersection_id": string,
  "incident_summary": string,
  "recommended_plan_changes": [{ "phase": string, "current_seconds": number, "recommended_seconds": number, "rationale": string }],
  "expected_delay_reduction_pct": number,
  "spillback_risk": "low"|"medium"|"high",
  "rollback_trigger": string,
  "confidence": number,
  "summary": string
}`;
  const usr = `Incident:\n${JSON.stringify(incident, null, 2)}\nIntersection context:\n${JSON.stringify(intersectionContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recommended_plan_changes: [] });
}

// 2. Pedestrian conflict detect
async function pedConflictDetect(intersection, recentEvents = []) {
  const sys = `${SYSTEM_PROMPT} Detect pedestrian-vehicle conflict risk at an intersection. Return strict JSON:
{
  "intersection_id": string,
  "conflict_score": number,
  "risk_level": "low"|"medium"|"high",
  "conflict_movements": [{ "movement": string, "vehicle_phase": string, "ped_phase": string, "rationale": string }],
  "recommendations": [{ "action": string, "priority": "low"|"medium"|"high" }],
  "data_gaps": [string],
  "summary": string
}`;
  const usr = `Intersection:\n${JSON.stringify(intersection, null, 2)}\nRecent events:\n${JSON.stringify(recentEvents, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', conflict_movements: [] });
}

// 3. Transit priority suggest
async function transitPrioritySuggest(route, intersectionsContext = []) {
  const sys = `${SYSTEM_PROMPT} Suggest where transit signal priority will provide best benefit. Return strict JSON:
{
  "route": string,
  "candidate_intersections": [{ "intersection_id": string, "expected_travel_time_savings_sec": number, "rationale": string, "tradeoff_for_cross_street": string }],
  "implementation_phases": [{ "phase": string, "duration_weeks": number, "scope": string }],
  "equity_notes": string,
  "summary": string
}`;
  const usr = `Route: ${route}\nIntersections context:\n${JSON.stringify(intersectionsContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', candidate_intersections: [] });
}

// 4. Work zone signal plan
async function workZoneSignalPlan(zone, affectedIntersections = []) {
  const sys = `${SYSTEM_PROMPT} Build a temporary signal plan for a work zone. Return strict JSON:
{
  "zone_id": string,
  "affected_intersections": [string],
  "plan_changes": [{ "intersection_id": string, "change": string, "rationale": string }],
  "detour_recommendations": [{ "from": string, "to": string, "via": string }],
  "expected_duration_days": number,
  "monitoring_kpis": [string],
  "summary": string
}`;
  const usr = `Work zone:\n${JSON.stringify(zone, null, 2)}\nAffected:\n${JSON.stringify(affectedIntersections, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', plan_changes: [] });
}

// 5. Special event signal plan
async function specialEventSignalPlan(eventObj, corridorContext = []) {
  const sys = `${SYSTEM_PROMPT} Build a signal plan for a special event. Return strict JSON:
{
  "event_id": string,
  "load_in_plan": [{ "intersection_id": string, "change": string }],
  "egress_plan": [{ "intersection_id": string, "change": string }],
  "transit_coordination": [string],
  "pedestrian_safety_actions": [string],
  "ped_capacity_intersections": [string],
  "summary": string
}`;
  const usr = `Event:\n${JSON.stringify(eventObj, null, 2)}\nCorridor context:\n${JSON.stringify(corridorContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', load_in_plan: [] });
}

// 6. Executive brief
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a city-level executive brief for traffic signal operations. Return strict JSON:
{
  "headline": string,
  "operational_picture": string,
  "network_health": { "operational_pct": number, "degraded_pct": number, "offline_pct": number, "narrative": string },
  "active_incidents_summary": [{ "incident": string, "severity": string, "status": string }],
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "options": [string], "recommendation": string }],
  "next_24h_outlook": string,
  "summary": string
}`;
  const usr = `Operational snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// 7. Signal health prognostic
async function signalHealthPrognostic(devices = []) {
  const sys = `${SYSTEM_PROMPT} Predict signal-system component failures. Return strict JSON:
{
  "network_health_score": number,
  "predictions": [{
    "device_id": string,
    "device_type": string,
    "predicted_failure_window_hours": number,
    "component_at_risk": string,
    "failure_probability": number,
    "recommended_action": string,
    "urgency": "routine"|"urgent"|"critical"
  }],
  "fleet_recommendations": [string],
  "estimated_downtime_hours_saved": number,
  "summary": string
}`;
  const usr = `Devices:\n${JSON.stringify(devices, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', predictions: [] });
}

// 8. Equity impact brief
async function equityImpactBrief(policy, demographics = {}) {
  const sys = `${SYSTEM_PROMPT} Assess equity impact of a signal-timing policy on under-served neighborhoods. Return strict JSON:
{
  "policy_summary": string,
  "impacted_groups": [{ "group": string, "impact_direction": "positive"|"neutral"|"negative", "magnitude": "low"|"medium"|"high", "narrative": string }],
  "ped_safety_impact": string,
  "transit_user_impact": string,
  "low_income_corridor_notes": string,
  "mitigations": [string],
  "summary": string
}`;
  const usr = `Policy:\n${JSON.stringify(policy, null, 2)}\nDemographics:\n${JSON.stringify(demographics, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', impacted_groups: [] });
}

// 9. Emission impact estimate
async function emissionImpactEstimate(corridor, metrics = {}) {
  const sys = `${SYSTEM_PROMPT} Estimate emission impact of a signal-timing change on a corridor. Return strict JSON:
{
  "corridor": string,
  "before_kg_co2_per_day": number,
  "after_kg_co2_per_day": number,
  "reduction_pct": number,
  "drivers": [{ "driver": string, "magnitude": "low"|"medium"|"high" }],
  "assumptions": [string],
  "summary": string
}`;
  const usr = `Corridor: ${corridor}\nMetrics:\n${JSON.stringify(metrics, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', drivers: [] });
}

// 10. Corridor coordination
async function corridorCoordination(corridor, intersections = []) {
  const sys = `${SYSTEM_PROMPT} Propose corridor coordination (green wave) for a list of intersections. Return strict JSON:
{
  "corridor": string,
  "recommended_cycle_length_sec": number,
  "recommended_offsets_sec": [{ "intersection_id": string, "offset_sec": number, "rationale": string }],
  "expected_travel_time_reduction_pct": number,
  "side_street_penalty_sec": number,
  "monitoring_kpis": [string],
  "summary": string
}`;
  const usr = `Corridor: ${corridor}\nIntersections:\n${JSON.stringify(intersections, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recommended_offsets_sec: [] });
}

// 11. Intersection prioritize
async function intersectionPrioritize(intersections = []) {
  const sys = `${SYSTEM_PROMPT} Rank intersections for retiming attention. Return strict JSON:
{
  "prioritized": [{ "intersection_id": string, "rank": number, "score": number, "rationale": string, "recommended_action": string }],
  "deferred": [{ "intersection_id": string, "reason": string }],
  "summary": string
}`;
  const usr = `Intersections:\n${JSON.stringify(intersections, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', prioritized: [] });
}

// 12. Citizen complaint summary
async function citizenComplaintSummary(complaintsText = '') {
  const sys = `${SYSTEM_PROMPT} Summarize and categorize a batch of citizen traffic-signal complaints. Return strict JSON:
{
  "total_complaints": number,
  "themes": [{ "theme": string, "count": number, "example": string, "recommended_action": string }],
  "hotspots": [{ "intersection_or_corridor": string, "count": number }],
  "urgent_items": [string],
  "summary": string
}`;
  const usr = `Complaints (free text or list):\n${complaintsText}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', themes: [] });
}

// 13. Sensor anomaly
async function sensorAnomaly(samples = []) {
  const sys = `${SYSTEM_PROMPT} Detect anomalies in detector / sensor health samples. Return strict JSON:
{
  "anomalies": [{ "sensor_id": string, "issue": string, "severity": "low"|"medium"|"high", "evidence": string, "recommended_action": string }],
  "fleet_health_pct": number,
  "next_inspection_priorities": [string],
  "summary": string
}`;
  const usr = `Sensor samples:\n${JSON.stringify(samples, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', anomalies: [] });
}

// 14. Work order draft
async function workOrderDraft(target, problemDescription) {
  const sys = `${SYSTEM_PROMPT} Draft a field work order for a traffic-signal maintenance issue. Return strict JSON:
{
  "target": string,
  "priority": "routine"|"urgent"|"emergency",
  "scope_of_work": [string],
  "parts_required": [{ "part": string, "qty": number }],
  "estimated_hours": number,
  "safety_notes": [string],
  "acceptance_criteria": [string],
  "summary": string
}`;
  const usr = `Target: ${target}\nProblem:\n${problemDescription}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', scope_of_work: [] });
}

// 15. Performance anomaly
async function performanceAnomaly(metrics = []) {
  const sys = `${SYSTEM_PROMPT} Identify performance anomalies across a set of intersection KPIs. Return strict JSON:
{
  "anomalies": [{ "intersection_id": string, "kpi": string, "observed": number, "target": number, "deviation_pct": number, "severity": "low"|"medium"|"high", "recommended_action": string }],
  "network_score": number,
  "top_outliers": [string],
  "summary": string
}`;
  const usr = `Performance metrics:\n${JSON.stringify(metrics, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', anomalies: [] });
}

// 16. Vendor quality score
async function vendorQualityScore(vendorHistory = []) {
  const sys = `${SYSTEM_PROMPT} Score traffic-signal hardware vendors based on field history. Return strict JSON:
{
  "vendor_scores": [{ "vendor": string, "score": number, "controllers_in_fleet": number, "incident_rate_pct": number, "strengths": [string], "weaknesses": [string], "recommended_action": string }],
  "fleet_recommendations": [string],
  "summary": string
}`;
  const usr = `Vendor / device history:\n${JSON.stringify(vendorHistory, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', vendor_scores: [] });
}

// ──────────────────────────────────────────────────────────────
// Pass 7 — full backlog implementation
// ALL outputs that would auto-activate or push signal plans
// must be advisory only with requires_operator_approval: true.
// The route layer enforces stamping; the service layer enforces
// schema and language ("advisory", "operator approval required").
// ──────────────────────────────────────────────────────────────

// 17. Congestion forecast (forward-looking demand / queue prediction)
async function congestionForecast(input = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a forward-looking congestion forecast from recent performance metrics + detector history. ADVISORY ONLY — operator approval required before any plan change. Return strict JSON:
{
  "horizon_minutes": number,
  "scope": string,
  "forecast": [{ "intersection_id": string, "predicted_queue_length_m": number, "predicted_delay_sec": number, "predicted_volume_vph": number, "confidence": number, "drivers": [string] }],
  "hotspots": [{ "intersection_id": string, "expected_lead_time_min": number, "severity": "low"|"medium"|"high" }],
  "data_gaps": [string],
  "advisory_actions": [{ "intersection_id": string, "suggested_action": string, "rationale": string }],
  "summary": string
}`;
  const usr = `Forecast input:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', forecast: [], hotspots: [] });
}

// 18. Signal-timing optimize (general optimizer over a demand profile)
async function signalTimingOptimize(input = {}) {
  const sys = `${SYSTEM_PROMPT} Generate split / cycle / offset recommendations for one intersection (or a small set) from a time-of-day demand profile. ADVISORY ONLY — do NOT auto-activate. Output must be a recommendation that an operator can review and approve. Return strict JSON:
{
  "intersection_id": string,
  "time_of_day_window": string,
  "recommended_cycle_length_sec": number,
  "recommended_splits": [{ "phase": string, "current_seconds": number, "recommended_seconds": number, "rationale": string }],
  "recommended_offset_sec": number,
  "expected_delay_reduction_pct": number,
  "expected_throughput_gain_pct": number,
  "side_street_penalty_sec": number,
  "rollback_trigger": string,
  "confidence": number,
  "summary": string
}`;
  const usr = `Optimizer input:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recommended_splits: [] });
}

// 19. Emergency-preempt sequence (corridor sequencer for an EMS route)
async function emergencyPreemptSequence(routeContext = {}) {
  const sys = `${SYSTEM_PROMPT} Sequence emergency preemption across a corridor for one EMS vehicle / route. ADVISORY ONLY — operator approval required. Do NOT autonomously push to controllers. Return strict JSON:
{
  "ems_route_id": string,
  "origin": string,
  "destination": string,
  "sequence": [{ "intersection_id": string, "preempt_step": number, "lead_time_sec": number, "phase_to_hold_green": string, "expected_arrival_offset_sec": number, "conflicting_movements_to_clear": [string] }],
  "total_estimated_savings_sec": number,
  "conflicts_to_resolve": [{ "intersection_id": string, "conflict": string, "mitigation": string }],
  "rollback_trigger": string,
  "confidence": number,
  "summary": string
}`;
  const usr = `EMS / route context:\n${JSON.stringify(routeContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', sequence: [] });
}

// 20. Incident-response coordinate (multi-domain playbook)
async function incidentResponseCoordinate(incident, context = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a multi-domain incident response playbook covering signals, transit, diversion and public comms. ADVISORY ONLY — operator approval required before any plan activation. Return strict JSON:
{
  "incident_id": string,
  "severity": "low"|"medium"|"high"|"critical",
  "signals_actions": [{ "intersection_id": string, "action": string, "rationale": string }],
  "transit_actions": [{ "route": string, "action": string, "rationale": string }],
  "diversion_actions": [{ "from": string, "to": string, "via": string, "rationale": string }],
  "communications_actions": [{ "audience": string, "message": string, "channel": string }],
  "agencies_to_notify": [string],
  "rollback_trigger": string,
  "confidence": number,
  "summary": string
}`;
  const usr = `Incident:\n${JSON.stringify(incident, null, 2)}\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', signals_actions: [] });
}

// 21. Equity response time (per-neighborhood disparity score)
async function equityResponseTime(input = {}) {
  const sys = `${SYSTEM_PROMPT} Score neighborhood-level incident response-time disparity from incidents joined to intersection geo / neighborhood demographics. ADVISORY ONLY. Return strict JSON:
{
  "scored_neighborhoods": [{
    "neighborhood_id": string,
    "name": string,
    "avg_response_minutes": number,
    "incident_count": number,
    "demographic_index": number,
    "disparity_score": number,
    "disparity_band": "equitable"|"watch"|"disparate"|"severely_disparate",
    "rationale": string
  }],
  "citywide_avg_response_minutes": number,
  "worst_disparities": [{ "neighborhood_id": string, "delta_minutes": number, "notes": string }],
  "recommended_actions": [{ "neighborhood_id": string, "action": string, "rationale": string }],
  "data_gaps": [string],
  "summary": string
}`;
  const usr = `Equity input:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', scored_neighborhoods: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  incidentAwareRetime,
  pedConflictDetect,
  transitPrioritySuggest,
  workZoneSignalPlan,
  specialEventSignalPlan,
  executiveBrief,
  signalHealthPrognostic,
  equityImpactBrief,
  emissionImpactEstimate,
  corridorCoordination,
  intersectionPrioritize,
  citizenComplaintSummary,
  sensorAnomaly,
  workOrderDraft,
  performanceAnomaly,
  vendorQualityScore,
  // pass 7
  congestionForecast,
  signalTimingOptimize,
  emergencyPreemptSequence,
  incidentResponseCoordinate,
  equityResponseTime,
};
