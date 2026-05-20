import React from 'react';
import AIPage from '../components/AIPage';
import { aiWorkOrderDraft } from '../services/api';

export default function AIWorkOrderDraftPage() {
  return (
    <AIPage
      title="AI · Work Order Draft"
      feature="work-order-draft"
      subtitle="Draft a field maintenance work order from a problem description."
      inputs={[
        { key: 'target',  label: 'Target (intersection / device / location)', placeholder: 'e.g. INT-007 — Hospital Way & Emergency Ln' },
        { key: 'problem', label: 'Problem Description', type: 'textarea', placeholder: 'Describe what is wrong, when it was noticed, and any reported symptoms.' },
      ]}
      run={(v) => aiWorkOrderDraft({ target: v.target, problem: v.problem })}
    />
  );
}
