const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'pedestrian_phases',
  fields: ['phase_id','intersection_id','walk_seconds','flash_seconds','status','last_event','notes'],
});
