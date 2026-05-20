import React from 'react';
import AIPage from '../components/AIPage';
import { aiPerformanceAnomaly } from '../services/api';

export default function AIPerformanceAnomalyPage() {
  return (
    <AIPage
      title="AI · Performance Anomaly"
      feature="performance-anomaly"
      subtitle="Identify off-target intersection KPIs from the current sample."
      inputs={[]}
      run={() => aiPerformanceAnomaly({})}
      buttonLabel="Scan KPIs"
    />
  );
}
