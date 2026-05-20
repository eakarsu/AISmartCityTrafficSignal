import React from 'react';
import CrudPage from '../components/CrudPage';
import { bikePhasesApi } from '../services/api';

export default function BikePhasesPage() {
  return (
    <CrudPage
      title="Bike Phases"
      subtitle="Dedicated bike signal phases and the conflicting vehicle movements."
      api={bikePhasesApi}
      statusKey="status"
      fields={[
        { key: 'phase_id',           label: 'Phase ID' },
        { key: 'intersection_id',    label: 'Intersection ID' },
        { key: 'duration_seconds',   label: 'Duration (sec)', type: 'number' },
        { key: 'conflict_movements', label: 'Conflict Movements' },
        { key: 'status',             label: 'Status', type: 'select', options: ['active','inactive','disabled'] },
        { key: 'last_event',         label: 'Last Event' },
        { key: 'notes',              label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
