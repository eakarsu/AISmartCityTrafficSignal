import React from 'react';
import CrudPage from '../components/CrudPage';
import { signalPlansApi } from '../services/api';

export default function SignalPlansPage() {
  return (
    <CrudPage
      title="Signal Plans"
      subtitle="Time-of-day signal plans deployed per intersection."
      api={signalPlansApi}
      statusKey="status"
      fields={[
        { key: 'plan_id',         label: 'Plan ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'period',          label: 'Period (e.g. AM_peak)' },
        { key: 'version',         label: 'Version' },
        { key: 'deployed_at',     label: 'Deployed At' },
        { key: 'status',          label: 'Status', type: 'select', options: ['active','staged','draft','retired'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
