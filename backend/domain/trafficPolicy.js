const STAGES = Object.freeze(['observed','validated','optimized','operator_review','approved','dispatched','applied','monitored','recovered','closed']);
const acknowledged = (receipt) => Boolean(receipt && receipt.provider && receipt.receipt_id && receipt.status === 'acknowledged' && !Number.isNaN(new Date(receipt.acknowledged_at).valueOf()));

function validateTelemetry(input, lastSequence) {
  for (const field of ['intersection_ref','controller_ref','source_ref','schema_version','sequence','recorded_at','checksum']) if (input[field] === undefined || input[field] === null || input[field] === '') throw new Error(`${field} is required`);
  const sequence = Number(input.sequence);
  const recordedAt = new Date(input.recorded_at);
  if (!Number.isInteger(sequence) || Number.isNaN(recordedAt.valueOf()) || (lastSequence != null && sequence <= Number(lastSequence))) throw new Error('invalid or replayed traffic telemetry');
  return { ...input, sequence, recorded_at: recordedAt.toISOString(), gap: lastSequence == null ? 0 : sequence - Number(lastSequence) - 1 };
}

function validatePlan(input) {
  for (const field of ['plan_ref','plan_version','constraint_version']) if (!input[field]) throw new Error(`${field} is required`);
  const cycle = Number(input.cycle_seconds);
  const pedestrian = Number(input.pedestrian_clearance_seconds);
  if (!Number.isFinite(cycle) || cycle < 30 || cycle > 240 || !Number.isFinite(pedestrian) || pedestrian < Number(input.minimum_pedestrian_clearance_seconds)) throw new Error('traffic safety limits violated');
  return { cycle_seconds: cycle, pedestrian_clearance_seconds: pedestrian, manual_review: true };
}

function validateTransition(from, to, context = {}) {
  const allowed = { observed:['validated'], validated:['optimized'], optimized:['operator_review'], operator_review:['optimized','approved'], approved:['dispatched'], dispatched:['applied'], applied:['monitored','recovered'], monitored:['recovered','closed','operator_review'], recovered:['operator_review','closed'], closed:[] };
  if (!allowed[from]?.includes(to)) throw new Error('invalid traffic transition');
  if (['approved','dispatched','closed'].includes(to) && !['traffic_operator','traffic_engineer','commander','admin','ops'].includes(context.role)) throw new Error('traffic authority required');
  if (to === 'approved' && (!context.safetyLimitsVerified || !context.manualFallback || context.actorId === context.createdBy)) throw new Error('independent safety approval and fallback required');
  if (to === 'dispatched' && !acknowledged(context.controllerReceipt)) throw new Error('typed acknowledged controller receipt required');
  if (to === 'closed' && !context.realizedOutcome) throw new Error('realized outcome required');
  return true;
}

module.exports = { STAGES, validateTelemetry, validatePlan, validateTransition };
