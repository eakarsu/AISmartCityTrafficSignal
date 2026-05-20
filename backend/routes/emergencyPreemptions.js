const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'emergency_preemptions',
  fields: ['preempt_id','intersection_id','vehicle','started_at','ended_at','status','notes'],
});
