import React from 'react';
import AIPage from '../components/AIPage';
import { aiSpecialEventSignalPlan } from '../services/api';

export default function AISpecialEventSignalPlanPage() {
  return (
    <AIPage
      title="AI · Special Event Signal Plan"
      feature="special-event-signal-plan"
      subtitle="Generate load-in / egress signal plan for a special event."
      inputs={[
        { key: 'event_id', label: 'Event ID', placeholder: 'e.g. EVT-0001' },
        { key: 'notes',    label: 'Notes',     type: 'textarea' },
      ]}
      run={(v) => aiSpecialEventSignalPlan({ event_id: v.event_id, notes: v.notes })}
    />
  );
}
