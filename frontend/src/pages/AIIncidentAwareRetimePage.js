import React from 'react';
import AIPage from '../components/AIPage';
import { aiIncidentAwareRetime } from '../services/api';

export default function AIIncidentAwareRetimePage() {
  return (
    <AIPage
      title="AI · Incident-Aware Retime"
      feature="incident-aware-retime"
      subtitle="Re-time signals around an open incident with rollback triggers."
      inputs={[
        { key: 'incident_id',     label: 'Incident ID (optional)', placeholder: 'e.g. INC-0001' },
        { key: 'intersection_id', label: 'Intersection ID',        placeholder: 'e.g. INT-001' },
        { key: 'notes',           label: 'Notes',                  type: 'textarea', placeholder: 'Free-form context (lane blockage, cleanup ETA, ROE).' },
      ]}
      run={(v) => aiIncidentAwareRetime({ incident_id: v.incident_id, intersection_id: v.intersection_id, notes: v.notes })}
    />
  );
}
