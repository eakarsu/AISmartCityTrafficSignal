const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'controllers',
  fields: ['controller_id','intersection_id','vendor','firmware','last_event','status','notes'],
});
