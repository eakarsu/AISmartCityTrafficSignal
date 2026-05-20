import React from 'react';
import AIPage from '../components/AIPage';
import { aiPedConflictDetect } from '../services/api';

export default function AIPedConflictDetectPage() {
  return (
    <AIPage
      title="AI · Ped Conflict Detect"
      feature="ped-conflict-detect"
      subtitle="Score pedestrian-vehicle conflict risk at an intersection."
      inputs={[
        { key: 'intersection_id', label: 'Intersection ID', placeholder: 'e.g. INT-005' },
        { key: 'notes',           label: 'Context Notes',   type: 'textarea' },
      ]}
      run={(v) => aiPedConflictDetect({ intersection_id: v.intersection_id, notes: v.notes })}
    />
  );
}
