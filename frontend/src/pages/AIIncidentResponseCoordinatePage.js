import React from 'react';
import AIPage from '../components/AIPage';
import { aiIncidentResponseCoordinate } from '../services/api';

export default function AIIncidentResponseCoordinatePage() {
  return (
    <AIPage
      title="AI · Incident Response Coordinate"
      feature="incident-response-coordinate"
      subtitle="Multi-domain playbook (signals + transit + diversion + comms) for one incident. Advisory only — operator approval required."
      inputs={[
        { key: 'incident_id', label: 'Incident ID', placeholder: 'e.g. INC-0001' },
        { key: 'notes',       label: 'Notes', type: 'textarea', placeholder: 'Lane blockage, agencies on scene, ETA to clear, etc.' },
      ]}
      run={(v) => aiIncidentResponseCoordinate({ incident_id: v.incident_id, notes: v.notes })}
    />
  );
}
