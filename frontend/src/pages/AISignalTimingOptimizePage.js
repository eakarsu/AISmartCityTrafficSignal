import React from 'react';
import AIPage from '../components/AIPage';
import { aiSignalTimingOptimize } from '../services/api';

export default function AISignalTimingOptimizePage() {
  return (
    <AIPage
      title="AI · Signal Timing Optimize"
      feature="signal-timing-optimize"
      subtitle="Generate split / cycle / offset recommendations from a time-of-day demand profile. Advisory only — does not push to controllers."
      inputs={[
        { key: 'intersection_id',    label: 'Intersection ID', placeholder: 'e.g. INT-001' },
        { key: 'time_of_day_window', label: 'Time-of-day window', placeholder: 'e.g. AM peak 07:00-09:30' },
        { key: 'notes',              label: 'Notes', type: 'textarea', placeholder: 'Demand pattern, ped concerns, transit priority, etc.' },
      ]}
      run={(v) => aiSignalTimingOptimize({
        intersection_id: v.intersection_id,
        time_of_day_window: v.time_of_day_window,
        notes: v.notes,
      })}
    />
  );
}
