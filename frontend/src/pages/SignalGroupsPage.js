import React from 'react';
import CrudPage from '../components/CrudPage';
import { signalGroupsApi } from '../services/api';

export default function SignalGroupsPage() {
  return (
    <CrudPage
      title="Signal Groups"
      subtitle="Coordinated corridors and signal subnetworks."
      api={signalGroupsApi}
      statusKey="status"
      fields={[
        { key: 'group_id',            label: 'Group ID' },
        { key: 'name',                label: 'Name' },
        { key: 'intersections_count', label: 'Intersections', type: 'number' },
        { key: 'coordinator',         label: 'Coordinator' },
        { key: 'status',              label: 'Status', type: 'select', options: ['active','standby','maintenance'] },
        { key: 'mode',                label: 'Mode', type: 'select', options: ['coordinated','transit_priority','pulsed','preempt_ready','event_mode','queue_protect','school_arrival','truck_progression','bike_progression','fixed_time','free_run'] },
        { key: 'notes',               label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
