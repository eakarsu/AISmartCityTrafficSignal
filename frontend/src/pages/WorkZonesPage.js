import React from 'react';
import CrudPage from '../components/CrudPage';
import { workZonesApi } from '../services/api';

export default function WorkZonesPage() {
  return (
    <CrudPage
      title="Work Zones"
      subtitle="Active and planned work zones affecting signal operations."
      api={workZonesApi}
      statusKey="status"
      fields={[
        { key: 'zone_id',      label: 'Zone ID' },
        { key: 'name',         label: 'Name' },
        { key: 'location',     label: 'Location' },
        { key: 'started_at',   label: 'Started At' },
        { key: 'expected_end', label: 'Expected End' },
        { key: 'status',       label: 'Status', type: 'select', options: ['planned','active','completed','suspended'] },
        { key: 'notes',        label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
