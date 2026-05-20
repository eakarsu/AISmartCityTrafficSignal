import React from 'react';
import AIPage from '../components/AIPage';
import { aiCorridorCoordination } from '../services/api';

export default function AICorridorCoordinationPage() {
  return (
    <AIPage
      title="AI · Corridor Coordination"
      feature="corridor-coordination"
      subtitle="Recommend cycle length and green-wave offsets along a corridor."
      inputs={[
        { key: 'corridor',         label: 'Corridor', placeholder: 'e.g. Downtown Core Corridor' },
        { key: 'intersection_ids', label: 'Intersection IDs (comma-separated)', placeholder: 'INT-001,INT-002,INT-014,INT-015' },
      ]}
      run={(v) => aiCorridorCoordination({ corridor: v.corridor, intersection_ids: v.intersection_ids })}
    />
  );
}
