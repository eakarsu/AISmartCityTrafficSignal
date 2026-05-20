import React from 'react';
import CrudPage from '../components/CrudPage';
import { detectorsApi } from '../services/api';

export default function DetectorsPage() {
  return (
    <CrudPage
      title="Detectors"
      subtitle="Loop, video, radar, pedestrian, bike and transit detectors."
      api={detectorsApi}
      statusKey="status"
      fields={[
        { key: 'detector_id',     label: 'Detector ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'type',            label: 'Type', type: 'select', options: ['loop','video','radar','pedestrian','bike','transit_AVL','EMS_transponder'] },
        { key: 'lane',            label: 'Lane' },
        { key: 'last_event',      label: 'Last Event' },
        { key: 'status',          label: 'Status', type: 'select', options: ['active','offline','fault'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
