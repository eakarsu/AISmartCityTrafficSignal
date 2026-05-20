const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'communications_cabinets',
  fields: ['cabinet_id','intersection_id','vendor','last_check','status','ip_address','notes'],
});
