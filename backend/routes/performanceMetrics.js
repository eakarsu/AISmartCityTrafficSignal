const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'performance_metrics',
  fields: ['metric_id','intersection_id','kpi','value','period','target','notes'],
});
