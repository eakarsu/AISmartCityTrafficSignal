# Audit Note — AISmartCityTrafficSignal

Domain: smart-city traffic signals — adaptive timing, congestion management, transit priority, pedestrian safety, incident response.

Stack: Node + Express + React + Postgres + OpenRouter.

## Current Inventory

### Non-AI Routes (CRUD + cross-cutting)
`/api/auth`, `/api/intersections`, `/api/signals`, `/api/detectors`, `/api/signal-plans`, `/api/incidents`, `/api/transit-priorities`, `/api/emergency-preemptions`, `/api/pedestrian-phases`, `/api/bike-phases`, `/api/work-zones`, `/api/special-events`, `/api/signal-groups`, `/api/communications-cabinets`, `/api/sensors-health`, `/api/video-feeds`, `/api/controllers`, `/api/performance-metrics`, `/api/audit-log`, `/api/notifications`, `/api/attachments`, `/api/webhooks` (+ test/delivery sub-routes), `/api/dashboard`, `/api/custom-views/{intersection-map,signal-timeline,incident-map,performance-trend,flow-heatmap,signal-state}`. (22 CRUD/feature routers + 6 custom views.)

### AI Endpoints (`/api/ai/*`, 16)
1. `incident-aware-retime` — retime around incident
2. `ped-conflict-detect` — pedestrian-conflict scorer per intersection
3. `transit-priority-suggest` — transit-priority recommender
4. `work-zone-signal-plan` — work-zone retiming
5. `special-event-signal-plan` — event-day plan
6. `executive-brief` — leadership snapshot
7. `signal-health-prognostic` — fleet prognosis
8. `equity-impact-brief` — equity dashboard analog (policy → demographic impact)
9. `emission-impact-estimate` — corridor-level emissions
10. `corridor-coordination` — multi-intersection coordinator
11. `intersection-prioritize` — rank network
12. `citizen-complaint-summary` — 311-style triage
13. `sensor-anomaly` — sensor fleet anomalies
14. `work-order-draft` — maintenance ticket drafter
15. `performance-anomaly` — KPI anomaly scan
16. `vendor-quality-score` — vendor scorecard
Plus `GET /api/ai/samples`, `GET /api/ai/history`. All persist to `ai_results`.

Frontend pages exist 1:1 for all 16 AI verbs plus full CRUD pages.

## Gap Analysis

### AI counterparts (requested vs. present)
- Signal-timing optimizer — PARTIAL (`corridor-coordination`, `incident-aware-retime`, `work-zone-signal-plan` cover situational retiming; no general "optimizer" verb that takes a time-of-day demand profile and produces split/cycle/offset). **MISSING (general optimizer).**
- Congestion forecaster — **MISSING** (no forward-looking demand/queue prediction endpoint).
- Incident-response coordinator — PARTIAL (`incident-aware-retime` handles per-intersection retime; no multi-agency coordinator covering preemption + diversion + transit reroute). **MISSING (multi-domain coordinator).**
- Pedestrian-safety scorer per intersection — PRESENT (`ped-conflict-detect`).
- Transit-priority recommender — PRESENT (`transit-priority-suggest`).
- Emergency-preempt sequencer — **MISSING** (CRUD table exists but no AI sequencer over a corridor).

### Non-AI features
- Intersection CRUD — PRESENT.
- Controller integrations (NTCIP) — **MISSING** (controllers CRUD exists, no NTCIP 1202/2306 client/adapter, no SNMP poll).
- 911 webhook ingest — PARTIAL (generic outbound webhooks present; no inbound 911/CAD ingest endpoint to auto-create incidents).
- Public dashboard — PARTIAL (authenticated `/api/dashboard` + custom views; no unauthenticated/public read-only surface).

### Custom features
- V2X (vehicle-to-infrastructure) hooks — **MISSING** (no SAE J2735/BSM/SPaT/MAP ingest or broadcast).
- Equity dashboard (response time by neighborhood) — PARTIAL (`equity-impact-brief` is advisory; no per-neighborhood response-time dataset/endpoint backed by incidents joined to census tracts).
- Event-day plan generator — PRESENT (`special-event-signal-plan`).

## Backlog (categorized)

### MECHANICAL (AI verbs, additive pattern matches existing `ai.js`/`services/ai.js`)
1. `POST /api/ai/congestion-forecast` — forecast queue/demand from `performance_metrics` + `detectors` history.
2. `POST /api/ai/signal-timing-optimize` — generate split/cycle/offset from a demand profile (advisory).
3. `POST /api/ai/emergency-preempt-sequence` — sequence preemption across a corridor for an EMS route. **NEEDS-PRODUCT-DECISION** (advisory vs. autonomous).
4. `POST /api/ai/incident-response-coordinate` — produce multi-domain (signals + transit + diversion + comms) playbook from one incident.
5. `POST /api/ai/equity-response-time` — score neighborhood response-time disparity from incidents + intersection geo.

### NEEDS-PRODUCT-DECISION (autonomous-control surfaces — advisory only by default)
- Any endpoint that would push a new plan to a controller (`signal-timing-optimize`, `emergency-preempt-sequence`, `incident-response-coordinate` if it directly mutates `signal_plans.status='active'`). Keep output as recommendation JSON; do not auto-activate.
- V2X broadcast (SPaT/MAP) — safety-critical, requires DOT signoff before any "send" path.
- Direct controller writes via NTCIP — same.

### NEEDS-CREDS / NEEDS-INTEGRATION
- NTCIP 1202/2306 controller integration (SNMP creds, vendor MIBs, field cabinets).
- 911/CAD inbound webhook (agency CAD endpoint + shared secret).
- V2X RSU/OBU stack (SAE J2735 codec + radio).
- Census/ACS demographic feed for equity-response-time scoring.

### NEEDS-PRODUCT-DECISION (non-AI)
- Public dashboard surface (which fields are safe to expose unauthenticated; rate limiting; cache layer).

## Implemented (this round)

None — audit-only.

## Apply pass 7 (full backlog implementation)

### Endpoints (backend)

MECHANICAL — 5 new AI verbs, all advisory-only, all stamped
`requires_operator_approval: true` / `auto_activate: false` at the route layer:

- `POST /api/ai/congestion-forecast` — `backend/routes/ai.js` (svc `congestionForecast`)
- `POST /api/ai/signal-timing-optimize` — split/cycle/offset recommender
- `POST /api/ai/emergency-preempt-sequence` — corridor preempt sequencer
- `POST /api/ai/incident-response-coordinate` — multi-domain playbook
- `POST /api/ai/equity-response-time` — neighborhood disparity scorer
  (joins `equity_neighborhoods` + `incidents` + `intersections`)

NEEDS-PRODUCT-DECISION → built:

- `GET  /api/public/dashboard` — unauthenticated aggregate counts only,
  30s in-process cache, no PII, no controller/cabinet ids, no incident
  detail. Mounted BEFORE `app.use('/api', authenticateToken)` in
  `backend/server.js`.
- `GET  /api/public/dashboard/equity-snapshot` — neighborhood names +
  average response minutes only (no demographic detail).
- `GET/POST/PUT/DELETE /api/equity-neighborhoods` — operator-curated
  dataset table (`backend/routes/equityNeighborhoods.js`).

NEEDS-CREDS → 503 stubs at `backend/routes/integrations.js`:

- `GET  /api/integrations/ntcip/controllers/:id/status`
- `POST /api/integrations/ntcip/controllers/:id/push-plan`
  (intentionally blocked — DOT signoff required, advisory-only path is
   `/api/ai/signal-timing-optimize`)
- `POST /api/integrations/cad/inbound`
- `GET  /api/integrations/v2x/spat`
- `GET  /api/integrations/v2x/map`
- `GET  /api/integrations/census/acs`
- `GET  /api/integrations` — index of stubs

All stubs return HTTP 503 with a stable JSON body that documents the
required env vars and the product / DOT decision that's blocking enablement.

### Pages (frontend)

- `frontend/src/pages/AICongestionForecastPage.js`
- `frontend/src/pages/AISignalTimingOptimizePage.js`
- `frontend/src/pages/AIEmergencyPreemptSequencePage.js`
- `frontend/src/pages/AIIncidentResponseCoordinatePage.js`
- `frontend/src/pages/AIEquityResponseTimePage.js`
- `frontend/src/pages/EquityNeighborhoodsPage.js` (CRUD)
- `frontend/src/pages/PublicDashboardPage.js` — mounted OUTSIDE
  `<RequireAuth>` at route `/public`.

`App.js` + `components/Sidebar.js` updated; `services/api.js` extended
with `aiCongestionForecast`, `aiSignalTimingOptimize`,
`aiEmergencyPreemptSequence`, `aiIncidentResponseCoordinate`,
`aiEquityResponseTime`, `equityNeighborhoodsApi`,
`getPublicDashboard`, `getPublicEquitySnapshot`, `integrationsApi`.

### Tables / migration

- `backend/migrations/002_pass7_backlog.sql`
  - new `equity_neighborhoods` (id, neighborhood_id, name, census_tract,
    population, median_household_income, pct_low_income, pct_no_vehicle,
    pct_senior_65plus, pct_disabled, intersection_ids,
    avg_incident_response_minutes, notes, created_at, updated_at)
  - index `idx_equity_neighborhoods_tract`
  - seeds 7 illustrative neighborhoods (Downtown Core, Old Town Heritage,
    University, Hospital District, Lincoln School, Industrial/Port,
    Airport Approach) so equity-response-time has data when the live
    Census/ACS feed isn't wired.

### Advisory-only enforcement

Route layer in `backend/routes/ai.js` defines `ADVISORY_STAMP` =
`{ advisory: true, requires_operator_approval: true, auto_activate: false,
   source: 'AI recommendation — not auto-pushed to controllers' }` and
applies `stampAdvisory()` to every Pass-7 verb's output before recording
and responding. None of the new verbs mutate `signal_plans`,
`controllers`, `emergency_preemptions`, or any field asset.

### Skipped (intentional)

- NTCIP push-plan, V2X SPaT/MAP broadcast — left as 503 stubs; DOT
  signoff required.
- 911/CAD inbound auto-create — left as 503 stub; needs shared secret
  and HMAC verify.
- Census/ACS live feed — 503 stub; `equity_neighborhoods` is the
  operator-curated stand-in.
- No new npm dependencies, no breaking changes to existing routes,
  schemas, or response shapes.

### Syntax

`node --check` passed on: `backend/server.js`, `backend/routes/ai.js`,
`backend/routes/publicDashboard.js`, `backend/routes/integrations.js`,
`backend/routes/equityNeighborhoods.js`, `backend/services/ai.js`.

## Status

Pass 7 — full backlog implemented. 5 advisory-only AI verbs + public
dashboard + equity-by-neighborhood dataset shipped; NEEDS-CREDS surfaces
returned as documented 503 stubs.
