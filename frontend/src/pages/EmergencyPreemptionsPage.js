import React from 'react';
import CrudPage from '../components/CrudPage';
import { emergencyPreemptionsApi } from '../services/api';

export default function EmergencyPreemptionsPage() {
  return (
    <CrudPage
      title="Emergency Preemptions"
      subtitle="EMS / fire / police preempt events at signalized intersections."
      api={emergencyPreemptionsApi}
      statusKey="status"
      fields={[
        { key: 'preempt_id',      label: 'Preempt ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'vehicle',         label: 'Vehicle' },
        { key: 'started_at',      label: 'Started At' },
        { key: 'ended_at',        label: 'Ended At' },
        { key: 'status',          label: 'Status', type: 'select', options: ['active','completed','aborted'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
