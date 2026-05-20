const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'incidents',
  fields: ['incident_id','intersection_id','type','severity','opened_at','status','notes'],
});
