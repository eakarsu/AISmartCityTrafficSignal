import React from 'react';
import CrudPage from '../components/CrudPage';
import { sensorsHealthApi } from '../services/api';

export default function SensorsHealthPage() {
  return (
    <CrudPage
      title="Sensors Health"
      subtitle="Sensor battery, status and last signal."
      api={sensorsHealthApi}
      statusKey="status"
      fields={[
        { key: 'health_id',   label: 'Health ID' },
        { key: 'sensor_id',   label: 'Sensor ID' },
        { key: 'status',      label: 'Status', type: 'select', options: ['ok','degraded','fault','offline'] },
        { key: 'last_signal', label: 'Last Signal' },
        { key: 'battery_pct', label: 'Battery %', type: 'number' },
        { key: 'ts',          label: 'Timestamp' },
        { key: 'notes',       label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
