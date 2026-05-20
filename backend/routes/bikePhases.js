const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'bike_phases',
  fields: ['phase_id','intersection_id','duration_seconds','conflict_movements','status','last_event','notes'],
});
