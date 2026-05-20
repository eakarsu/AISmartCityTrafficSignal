import React from 'react';
import CrudPage from '../components/CrudPage';
import { videoFeedsApi } from '../services/api';

export default function VideoFeedsPage() {
  return (
    <CrudPage
      title="Video Feeds"
      subtitle="Intersection camera feeds and last image."
      api={videoFeedsApi}
      statusKey="status"
      fields={[
        { key: 'feed_id',         label: 'Feed ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'camera_id',       label: 'Camera ID' },
        { key: 'stream_url',      label: 'Stream URL' },
        { key: 'status',          label: 'Status', type: 'select', options: ['streaming','degraded','offline'] },
        { key: 'last_image',      label: 'Last Image' },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
