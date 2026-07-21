const test=require('node:test');const assert=require('node:assert/strict');const p=require('../domain/trafficPolicy');
const event={intersection_ref:'i1',controller_ref:'c1',source_ref:'d1',schema_version:'v1',sequence:8,recorded_at:'2026-07-19T00:00:00Z',checksum:'sha:x'};
test('normalizes traffic telemetry and gaps',()=>assert.equal(p.validateTelemetry(event,5).gap,2));
test('rejects replayed telemetry',()=>assert.throws(()=>p.validateTelemetry(event,8),/replayed/));
test('enforces timing safety limits',()=>assert.throws(()=>p.validatePlan({plan_ref:'p',plan_version:'v1',constraint_version:'c1',cycle_seconds:10,pedestrian_clearance_seconds:2,minimum_pedestrian_clearance_seconds:5}),/safety/));
test('valid plan remains manual review',()=>assert.equal(p.validatePlan({plan_ref:'p',plan_version:'v1',constraint_version:'c1',cycle_seconds:90,pedestrian_clearance_seconds:12,minimum_pedestrian_clearance_seconds:8}).manual_review,true));
test('approval requires independent safety review and fallback',()=>assert.throws(()=>p.validateTransition('operator_review','approved',{role:'ops',actorId:'u1',createdBy:'u1',safetyLimitsVerified:true,manualFallback:true}),/independent/));
test('dispatch and closure require real receipts',()=>{assert.throws(()=>p.validateTransition('approved','dispatched',{role:'ops'}),/receipt/);assert.equal(p.validateTransition('approved','dispatched',{role:'ops',controllerReceipt:{provider:'ntcip',receipt_id:'r1',status:'acknowledged',acknowledged_at:'2026-07-19'}}),true);assert.throws(()=>p.validateTransition('monitored','closed',{role:'ops'}),/outcome/);});
