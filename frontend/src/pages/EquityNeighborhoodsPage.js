import React from 'react';
import CrudPage from '../components/CrudPage';
import { equityNeighborhoodsApi } from '../services/api';

export default function EquityNeighborhoodsPage() {
  return (
    <CrudPage
      title="Equity Neighborhoods"
      subtitle="Operator-curated demographic + response-time dataset. Backs AI · Equity Response Time. Real ACS feed is gated on /api/integrations/census/acs (NEEDS-CREDS)."
      api={equityNeighborhoodsApi}
      fields={[
        { key: 'neighborhood_id',               label: 'Neighborhood ID' },
        { key: 'name',                          label: 'Name' },
        { key: 'census_tract',                  label: 'Census Tract' },
        { key: 'population',                    label: 'Population', type: 'number' },
        { key: 'median_household_income',       label: 'Median HH Income (USD)', type: 'number' },
        { key: 'pct_low_income',                label: '% Low Income', type: 'number' },
        { key: 'pct_no_vehicle',                label: '% No Vehicle', type: 'number' },
        { key: 'pct_senior_65plus',             label: '% Senior 65+', type: 'number' },
        { key: 'pct_disabled',                  label: '% Disabled', type: 'number' },
        { key: 'intersection_ids',              label: 'Intersection IDs (comma-sep)' },
        { key: 'avg_incident_response_minutes', label: 'Avg Response (min)', type: 'number' },
        { key: 'notes',                         label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
