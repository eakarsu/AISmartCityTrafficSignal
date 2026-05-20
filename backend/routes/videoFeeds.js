const buildCrud = require('./_crudFactory');
module.exports = buildCrud({
  table: 'video_feeds',
  fields: ['feed_id','intersection_id','camera_id','stream_url','status','last_image','notes'],
});
