import React from 'react';
import AIPage from '../components/AIPage';
import { aiSensorAnomaly } from '../services/api';

export default function AISensorAnomalyPage() {
  return (
    <AIPage
      title="AI · Sensor Anomaly"
      feature="sensor-anomaly"
      subtitle="Find anomalous detector / sensor behavior in the current fleet."
      inputs={[]}
      run={() => aiSensorAnomaly({})}
      buttonLabel="Scan Sensors"
    />
  );
}
