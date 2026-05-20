const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'signal_plans',
  fields: ['plan_id','intersection_id','period','version','deployed_at','status','notes'],
});
