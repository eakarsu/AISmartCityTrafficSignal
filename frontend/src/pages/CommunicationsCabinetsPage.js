import React from 'react';
import CrudPage from '../components/CrudPage';
import { communicationsCabinetsApi } from '../services/api';

export default function CommunicationsCabinetsPage() {
  return (
    <CrudPage
      title="Communications Cabinets"
      subtitle="Field cabinets, vendor, IP and reachability state."
      api={communicationsCabinetsApi}
      statusKey="status"
      fields={[
        { key: 'cabinet_id',      label: 'Cabinet ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'vendor',          label: 'Vendor' },
        { key: 'last_check',      label: 'Last Check' },
        { key: 'status',          label: 'Status', type: 'select', options: ['healthy','degraded','unreachable','offline'] },
        { key: 'ip_address',      label: 'IP Address' },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
