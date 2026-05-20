import React from 'react';
import CrudPage from '../components/CrudPage';
import { controllersApi } from '../services/api';

export default function ControllersPage() {
  return (
    <CrudPage
      title="Controllers"
      subtitle="Signal controllers, vendor and firmware."
      api={controllersApi}
      statusKey="status"
      fields={[
        { key: 'controller_id',   label: 'Controller ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'vendor',          label: 'Vendor' },
        { key: 'firmware',        label: 'Firmware' },
        { key: 'last_event',      label: 'Last Event' },
        { key: 'status',          label: 'Status', type: 'select', options: ['online','degraded','offline'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
