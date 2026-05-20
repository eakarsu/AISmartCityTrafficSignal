import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="City-level traffic-signal operational snapshot and decisions required."
      inputs={[
        { key: 'notes', label: 'Optional bias notes', type: 'textarea', placeholder: 'e.g. Focus on Downtown Core and 5th Ave Streetcar Corridor.' },
      ]}
      run={(v) => aiExecutiveBrief({ notes: v.notes })}
      buttonLabel="Generate Brief"
    />
  );
}
