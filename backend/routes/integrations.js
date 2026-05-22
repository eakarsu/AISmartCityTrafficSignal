// Pass 7 — NEEDS-CREDS integration stubs.
// These endpoints return 503 with a stable shape so the frontend can
// surface a "needs creds" UX without crashing. They do NOT call any
// vendor service. They do NOT auto-mutate any city asset.
//
// Each stub documents:
//   - what real integration would do
//   - which secret(s) it requires
//   - which DOT / agency signoff is required before enabling
//
// To enable any of these for real, an operator must:
//   1. provision creds in env (NTCIP_SNMP_COMMUNITY, CAD_WEBHOOK_SECRET, V2X_RSU_ENDPOINT, CENSUS_API_KEY)
//   2. replace these route handlers with the real adapters
//   3. obtain DOT signoff for the V2X and NTCIP write paths

const express = require('express');
const router = express.Router();

function stub(body) {
  return {
    status: 503,
    body: {
      ok: false,
      stub: true,
      requires_operator_approval: true,
      error: body.error,
      integration: body.integration,
      required_credentials: body.required_credentials || [],
      product_decision: body.product_decision || null,
      docs: body.docs || null,
    },
  };
}

// NTCIP 1202 / 2306 controller integration — SNMP poll + plan push
router.get('/ntcip/controllers/:controllerId/status', (req, res) => {
  const { body, status } = stub({
    error: 'NTCIP 1202/2306 controller integration is not configured.',
    integration: 'ntcip-1202-2306',
    required_credentials: ['NTCIP_SNMP_COMMUNITY', 'NTCIP_CONTROLLER_HOST', 'NTCIP_VENDOR_MIB_PATH'],
    product_decision: 'Direct controller writes require DOT signoff. Reads are safe once SNMP creds exist.',
    docs: 'See NTCIP 1202 (Actuated Signal Controller) and 2306 (XML transport).',
  });
  res.status(status).json(body);
});

router.post('/ntcip/controllers/:controllerId/push-plan', (req, res) => {
  const { body, status } = stub({
    error: 'NTCIP push-plan is intentionally not implemented — DOT signoff required, advisory only.',
    integration: 'ntcip-1202-2306',
    required_credentials: ['NTCIP_SNMP_COMMUNITY', 'NTCIP_CONTROLLER_HOST'],
    product_decision: 'Push paths are blocked until DOT signoff. Use /api/ai/signal-timing-optimize and have an operator approve.',
  });
  res.status(status).json(body);
});

// 911 / CAD inbound webhook — agency CAD pushes incidents to us
router.post('/cad/inbound', (req, res) => {
  const { body, status } = stub({
    error: '911/CAD inbound webhook is not configured (shared secret missing).',
    integration: 'cad-inbound-webhook',
    required_credentials: ['CAD_WEBHOOK_SECRET', 'CAD_ALLOWED_SOURCE_IPS'],
    product_decision: 'Once CAD secret is provisioned, this endpoint must HMAC-verify before auto-creating incidents.',
  });
  res.status(status).json(body);
});

// V2X SPaT / MAP — broadcast signal phase + map data to RSUs
router.get('/v2x/spat', (req, res) => {
  const { body, status } = stub({
    error: 'V2X SPaT broadcast is not configured.',
    integration: 'v2x-spat-map',
    required_credentials: ['V2X_RSU_ENDPOINT', 'V2X_OBE_CERT_PATH'],
    product_decision: 'Safety-critical. Requires DOT signoff and J2735 codec validation before any broadcast.',
    docs: 'SAE J2735 (BSM / SPaT / MAP).',
  });
  res.status(status).json(body);
});

router.get('/v2x/map', (req, res) => {
  const { body, status } = stub({
    error: 'V2X MAP message generation is not configured.',
    integration: 'v2x-spat-map',
    required_credentials: ['V2X_RSU_ENDPOINT'],
    product_decision: 'Safety-critical. Requires DOT signoff.',
  });
  res.status(status).json(body);
});

// Census / ACS demographic feed — backs equity-response-time scoring
router.get('/census/acs', (req, res) => {
  const { body, status } = stub({
    error: 'Census ACS feed is not configured.',
    integration: 'census-acs',
    required_credentials: ['CENSUS_API_KEY'],
    product_decision: 'Until the live feed is wired, /api/equity-neighborhoods serves an operator-curated dataset.',
    docs: 'https://www.census.gov/data/developers/data-sets/acs-5year.html',
  });
  res.status(status).json(body);
});

// Helpful index for operators
router.get('/', (req, res) => {
  res.json({
    pass: 7,
    note: 'Integration stubs — 503 by design. See _AUDIT_NOTE.md.',
    available: [
      'GET  /api/integrations/ntcip/controllers/:id/status',
      'POST /api/integrations/ntcip/controllers/:id/push-plan',
      'POST /api/integrations/cad/inbound',
      'GET  /api/integrations/v2x/spat',
      'GET  /api/integrations/v2x/map',
      'GET  /api/integrations/census/acs',
    ],
  });
});

module.exports = router;
