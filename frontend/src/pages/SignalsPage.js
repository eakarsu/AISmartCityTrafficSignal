import React from 'react';
import CrudPage from '../components/CrudPage';
import { signalsApi } from '../services/api';

export default function SignalsPage() {
  return (
    <CrudPage
      title="Signals"
      subtitle="Individual signal heads and their current color/state."
      api={signalsApi}
      statusKey="status"
      fields={[
        { key: 'signal_id',       label: 'Signal ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'direction',       label: 'Direction', type: 'select', options: ['NB','SB','EB','WB','NE','NW','SE','SW'] },
        { key: 'color',           label: 'Color', type: 'select', options: ['red','yellow','green','flash','dark'] },
        { key: 'last_change',     label: 'Last Change' },
        { key: 'status',          label: 'Status', type: 'select', options: ['normal','preempt','transit_priority','fault','manual'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
