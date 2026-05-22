import React from 'react';
import AIPage from '../components/AIPage';
import { aiCongestionForecast } from '../services/api';

export default function AICongestionForecastPage() {
  return (
    <AIPage
      title="AI · Congestion Forecast"
      feature="congestion-forecast"
      subtitle="Forward-looking queue / demand forecast from recent metrics + detector history. Advisory only — operator approval required for any plan change."
      inputs={[
        { key: 'scope',            label: 'Scope',            placeholder: 'e.g. citywide, Downtown Core Corridor' },
        { key: 'horizon_minutes',  label: 'Horizon (minutes)', type: 'number', placeholder: '60' },
        { key: 'notes',            label: 'Notes', type: 'textarea', placeholder: 'Context: peak window, upcoming event, weather, etc.' },
      ]}
      run={(v) => aiCongestionForecast({
        scope: v.scope,
        horizon_minutes: v.horizon_minutes ? Number(v.horizon_minutes) : 60,
        notes: v.notes,
      })}
    />
  );
}
