const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'signals',
  fields: ['signal_id','intersection_id','direction','color','last_change','status','notes'],
});
