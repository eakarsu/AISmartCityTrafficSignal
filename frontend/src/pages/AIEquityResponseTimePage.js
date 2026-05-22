import React from 'react';
import AIPage from '../components/AIPage';
import { aiEquityResponseTime } from '../services/api';

export default function AIEquityResponseTimePage() {
  return (
    <AIPage
      title="AI · Equity Response Time"
      feature="equity-response-time"
      subtitle="Score neighborhood incident-response disparity from the equity_neighborhoods dataset + recent incidents. Advisory only."
      inputs={[
        { key: 'focus', label: 'Focus filter', type: 'select', options: ['all', 'low_income', 'no_vehicle', 'senior', 'school'] },
        { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional bias / framing for the analysis.' },
      ]}
      run={(v) => aiEquityResponseTime({ focus: v.focus, notes: v.notes })}
    />
  );
}
