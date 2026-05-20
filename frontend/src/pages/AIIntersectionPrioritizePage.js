import React from 'react';
import AIPage from '../components/AIPage';
import { aiIntersectionPrioritize } from '../services/api';

export default function AIIntersectionPrioritizePage() {
  return (
    <AIPage
      title="AI · Intersection Prioritize"
      feature="intersection-prioritize"
      subtitle="Rank intersections in the current network for retiming attention."
      inputs={[]}
      run={() => aiIntersectionPrioritize({})}
      buttonLabel="Rank Intersections"
    />
  );
}
