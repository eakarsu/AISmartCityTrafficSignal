import React from 'react';
import CrudPage from '../components/CrudPage';
import { specialEventsApi } from '../services/api';

export default function SpecialEventsPage() {
  return (
    <CrudPage
      title="Special Events"
      subtitle="Stadium / parade / marathon / festival load on the signal network."
      api={specialEventsApi}
      statusKey="status"
      fields={[
        { key: 'event_id',            label: 'Event ID' },
        { key: 'name',                label: 'Name' },
        { key: 'location',            label: 'Location' },
        { key: 'expected_attendance', label: 'Expected Attendance', type: 'number' },
        { key: 'started_at',          label: 'Starts At' },
        { key: 'status',              label: 'Status', type: 'select', options: ['scheduled','active','completed','cancelled'] },
        { key: 'notes',               label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
