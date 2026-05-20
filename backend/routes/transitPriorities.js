const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'transit_priorities',
  fields: ['priority_id','intersection_id','route','vehicle_type','status','last_used','notes'],
});
