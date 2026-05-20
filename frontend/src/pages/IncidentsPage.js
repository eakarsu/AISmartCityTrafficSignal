import React from 'react';
import CrudPage from '../components/CrudPage';
import { incidentsApi } from '../services/api';

export default function IncidentsPage() {
  return (
    <CrudPage
      title="Incidents"
      subtitle="Open and recent traffic-signal incidents."
      api={incidentsApi}
      statusKey="status"
      fields={[
        { key: 'incident_id',     label: 'Incident ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'type',            label: 'Type' },
        { key: 'severity',        label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at',       label: 'Opened At' },
        { key: 'status',          label: 'Status', type: 'select', options: ['open','investigating','closed'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
