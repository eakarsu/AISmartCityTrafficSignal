const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'special_events',
  fields: ['event_id','name','location','expected_attendance','started_at','status','notes'],
});
