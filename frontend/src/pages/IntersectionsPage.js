import React from 'react';
import CrudPage from '../components/CrudPage';
import { intersectionsApi } from '../services/api';

export default function IntersectionsPage() {
  return (
    <CrudPage
      title="Intersections"
      subtitle="Signalized intersections across the city network."
      api={intersectionsApi}
      statusKey="status"
      fields={[
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'name',            label: 'Name' },
        { key: 'location',        label: 'Location / District' },
        { key: 'signal_count',    label: 'Signal Count', type: 'number' },
        { key: 'last_retimed',    label: 'Last Retimed', type: 'date' },
        { key: 'status',          label: 'Status', type: 'select', options: ['operational','degraded','maintenance','offline'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
