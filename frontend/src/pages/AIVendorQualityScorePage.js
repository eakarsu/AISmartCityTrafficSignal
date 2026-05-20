import React from 'react';
import AIPage from '../components/AIPage';
import { aiVendorQualityScore } from '../services/api';

export default function AIVendorQualityScorePage() {
  return (
    <AIPage
      title="AI · Vendor Quality Score"
      feature="vendor-quality-score"
      subtitle="Score traffic-signal hardware vendors using current field history."
      inputs={[]}
      run={() => aiVendorQualityScore({})}
      buttonLabel="Score Vendors"
    />
  );
}
