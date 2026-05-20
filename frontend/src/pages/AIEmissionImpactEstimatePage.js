import React from 'react';
import AIPage from '../components/AIPage';
import { aiEmissionImpactEstimate } from '../services/api';

export default function AIEmissionImpactEstimatePage() {
  return (
    <AIPage
      title="AI · Emission Impact Estimate"
      feature="emission-impact-estimate"
      subtitle="Estimate CO2 reduction (or increase) from a corridor signal-timing change."
      inputs={[
        { key: 'corridor', label: 'Corridor', placeholder: 'e.g. Downtown Core Corridor' },
        { key: 'notes',    label: 'Notes',     type: 'textarea' },
      ]}
      run={(v) => aiEmissionImpactEstimate({ corridor: v.corridor, notes: v.notes })}
    />
  );
}
