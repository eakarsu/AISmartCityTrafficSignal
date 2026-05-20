import React from 'react';
import AIPage from '../components/AIPage';
import { aiWorkZoneSignalPlan } from '../services/api';

export default function AIWorkZoneSignalPlanPage() {
  return (
    <AIPage
      title="AI · Work Zone Signal Plan"
      feature="work-zone-signal-plan"
      subtitle="Generate a temporary signal plan around an active work zone."
      inputs={[
        { key: 'zone_id', label: 'Work Zone ID', placeholder: 'e.g. WZ-0001' },
        { key: 'notes',   label: 'Notes',         type: 'textarea' },
      ]}
      run={(v) => aiWorkZoneSignalPlan({ zone_id: v.zone_id, notes: v.notes })}
    />
  );
}
