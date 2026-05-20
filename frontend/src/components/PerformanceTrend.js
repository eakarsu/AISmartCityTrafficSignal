import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getPerformanceTrend } from '../services/api';

const PALETTE = [
  '#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed',
  '#0891b2', '#db2777', '#ca8a04', '#0d9488', '#9333ea',
];

export default function PerformanceTrend() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getPerformanceTrend()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  if (err) return <div className="ai-error">{err}</div>;
  if (!data) return <div>Loading performance metrics...</div>;

  const kpis = data.kpis || [];
  const series = data.series || [];

  if (!series.length) {
    return <div style={{ color: '#666' }}>No performance metrics recorded yet.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
        {series.length} time buckets · {kpis.length} KPIs
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={series} margin={{ top: 8, right: 24, left: 8, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" angle={-30} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis />
          <Tooltip />
          <Legend />
          {kpis.map((kpi, i) => (
            <Line
              key={kpi}
              type="monotone"
              dataKey={kpi}
              stroke={PALETTE[i % PALETTE.length]}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
