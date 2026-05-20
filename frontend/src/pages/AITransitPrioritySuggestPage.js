import React from 'react';
import AIPage from '../components/AIPage';
import { aiTransitPrioritySuggest } from '../services/api';

export default function AITransitPrioritySuggestPage() {
  return (
    <AIPage
      title="AI · Transit Priority Suggest"
      feature="transit-priority-suggest"
      subtitle="Pick best TSP candidate intersections for a transit route."
      inputs={[
        { key: 'route', label: 'Route', placeholder: 'e.g. Route 15 BRT' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiTransitPrioritySuggest({ route: v.route, notes: v.notes })}
    />
  );
}
