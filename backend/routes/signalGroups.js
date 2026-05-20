const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'signal_groups',
  fields: ['group_id','name','intersections_count','coordinator','status','mode','notes'],
});
