import React from 'react';
import AIPage from '../components/AIPage';
import { aiCitizenComplaintSummary } from '../services/api';

export default function AICitizenComplaintSummaryPage() {
  return (
    <AIPage
      title="AI · Citizen Complaint Summary"
      feature="citizen-complaint-summary"
      subtitle="Theme, count, hotspot and urgent items from a batch of complaints."
      inputs={[
        { key: 'complaints', label: 'Complaints (one per line)', type: 'textarea',
          placeholder: 'Paste a batch of citizen-reported issues.' },
      ]}
      run={(v) => aiCitizenComplaintSummary({ complaints: v.complaints })}
    />
  );
}
