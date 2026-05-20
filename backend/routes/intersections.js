const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'intersections',
  fields: ['intersection_id','name','location','signal_count','last_retimed','status','notes'],
});
