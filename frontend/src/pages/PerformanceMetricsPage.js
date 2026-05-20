import React from 'react';
import CrudPage from '../components/CrudPage';
import { performanceMetricsApi } from '../services/api';

export default function PerformanceMetricsPage() {
  return (
    <CrudPage
      title="Performance Metrics"
      subtitle="KPI samples per intersection / period (avg delay, AOG, queue, etc.)."
      api={performanceMetricsApi}
      fields={[
        { key: 'metric_id',       label: 'Metric ID' },
        { key: 'intersection_id', label: 'Intersection ID' },
        { key: 'kpi',             label: 'KPI' },
        { key: 'value',           label: 'Value',  type: 'number' },
        { key: 'period',          label: 'Period (AM_peak / PM_peak / off_peak / event / daily / arrival)' },
        { key: 'target',          label: 'Target', type: 'number' },
        { key: 'notes',           label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
