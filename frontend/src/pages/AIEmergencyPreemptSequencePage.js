import React from 'react';
import AIPage from '../components/AIPage';
import { aiEmergencyPreemptSequence } from '../services/api';

export default function AIEmergencyPreemptSequencePage() {
  return (
    <AIPage
      title="AI · Emergency Preempt Sequence"
      feature="emergency-preempt-sequence"
      subtitle="Corridor preemption sequence for an EMS route. Advisory only — does not auto-push to controllers; operator approval required."
      inputs={[
        { key: 'ems_route_id',     label: 'EMS Route ID',     placeholder: 'e.g. EMS-001' },
        { key: 'origin',           label: 'Origin',           placeholder: 'e.g. Fire Station 3' },
        { key: 'destination',      label: 'Destination',      placeholder: 'e.g. INT-007 Hospital Way' },
        { key: 'intersection_ids', label: 'Intersection IDs (comma-sep)', placeholder: 'e.g. INT-001,INT-002,INT-007' },
        { key: 'notes',            label: 'Notes', type: 'textarea', placeholder: 'Code level, vehicle type, mutual aid notes' },
      ]}
      run={(v) => aiEmergencyPreemptSequence({
        ems_route_id: v.ems_route_id,
        origin: v.origin,
        destination: v.destination,
        intersection_ids: v.intersection_ids,
        notes: v.notes,
      })}
    />
  );
}
