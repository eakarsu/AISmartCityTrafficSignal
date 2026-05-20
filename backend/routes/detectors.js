const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'detectors',
  fields: ['detector_id','intersection_id','type','lane','last_event','status','notes'],
});
