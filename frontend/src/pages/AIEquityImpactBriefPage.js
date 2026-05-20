import React from 'react';
import AIPage from '../components/AIPage';
import { aiEquityImpactBrief } from '../services/api';

export default function AIEquityImpactBriefPage() {
  return (
    <AIPage
      title="AI · Equity Impact Brief"
      feature="equity-impact-brief"
      subtitle="Assess equity impact of a signal-timing policy on under-served groups."
      inputs={[
        { key: 'policy',       label: 'Policy', type: 'textarea',
          placeholder: 'e.g. Add transit signal priority to all Route 15 BRT intersections during PM peak.' },
        { key: 'demographics', label: 'Demographics / Corridor Context', type: 'textarea',
          placeholder: 'Census tract notes, no-car households, senior population, etc.' },
      ]}
      run={(v) => aiEquityImpactBrief({ policy: v.policy, demographics: { notes: v.demographics } })}
    />
  );
}
