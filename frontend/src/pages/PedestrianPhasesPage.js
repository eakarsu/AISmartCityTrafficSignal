import React from 'react';
import CrudPage from '../components/CrudPage';
import { pedestrianPhasesApi } from '../services/api';

export default function PedestrianPhasesPage() {
  return (
    <CrudPage
      title="Pedestrian Phases"
      subtitle="Walk / Flash timings and recent crossings per intersection."
      api={pedestrianPhasesApi}
      statusKey="status"
      fields={[
        { key: 'phase_id',        label: 'Phase ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'walk_seconds',    label: 'Walk (sec)',  type: 'number' },
        { key: 'flash_seconds',   label: 'Flash (sec)', type: 'number' },
        { key: 'status',          label: 'Status', type: 'select', options: ['active','inactive','disabled'] },
        { key: 'last_event',      label: 'Last Event' },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
