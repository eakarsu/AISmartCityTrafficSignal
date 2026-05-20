import React from 'react';
import CrudPage from '../components/CrudPage';
import { transitPrioritiesApi } from '../services/api';

export default function TransitPrioritiesPage() {
  return (
    <CrudPage
      title="Transit Priorities"
      subtitle="Transit signal priority registrations per route and vehicle type."
      api={transitPrioritiesApi}
      statusKey="status"
      fields={[
        { key: 'priority_id',     label: 'Priority ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'route',           label: 'Route' },
        { key: 'vehicle_type',    label: 'Vehicle Type', type: 'select', options: ['bus','streetcar','shuttle','trolley','school_bus'] },
        { key: 'status',          label: 'Status', type: 'select', options: ['enabled','disabled','event_only'] },
        { key: 'last_used',       label: 'Last Used' },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
