const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'work_zones',
  fields: ['zone_id','name','location','started_at','expected_end','status','notes'],
});
