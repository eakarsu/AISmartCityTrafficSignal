const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'sensors_health',
  fields: ['health_id','sensor_id','status','last_signal','battery_pct','ts','notes'],
});
