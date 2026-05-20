import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getSignalTimeline, getIntersectionMap } from '../services/api';

const COLOR_MAP = {
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
  flash: '#f97316',
};

export default function SignalTimeline() {
  const [intersections, setIntersections] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getIntersectionMap()
      .then((d) => {
        if (!alive) return;
        const list = (d.items || []).map((i) => i.intersection_id);
        setIntersections(list);
        setSelected((prev) => prev || list[0] || '');
      })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    getSignalTimeline(selected)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [selected]);

  // Convert the per-signal bars into recharts stacked-bar rows (one row per signal).
  const { rows, segmentKeys } = useMemo(() => {
    if (!data || !data.signals) return { rows: [], segmentKeys: [] };
    // Find the maximum number of segments so every row stacks the same count.
    const maxSeg = data.signals.reduce((m, s) => Math.max(m, s.bars.length), 0);
    const keys = Array.from({ length: maxSeg }, (_, i) => `seg_${i}`);
    const rowsOut = data.signals.map((s) => {
      const row = { name: `${s.signal_id} (${s.direction || ''})` };
      const colors = [];
      s.bars.forEach((b, i) => {
        row[`seg_${i}`] = Math.round((b.duration_ms || 0) / 1000); // seconds
        colors.push(COLOR_MAP[b.color] || '#9ca3af');
      });
      // pad missing
      for (let i = s.bars.length; i < maxSeg; i++) {
        row[`seg_${i}`] = 0;
        colors.push('#9ca3af');
      }
      row._colors = colors;
      return row;
    });
    return { rows: rowsOut, segmentKeys: keys };
  }, [data]);

  if (err) return <div className="ai-error">{err}</div>;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Intersection:</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {intersections.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>
          Last {data?.window_minutes || 10} min · stacked phase durations (seconds)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(220, (rows.length || 1) * 38 + 80)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 80, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip />
          <Legend payload={[
            { value: 'green',  type: 'square', color: COLOR_MAP.green },
            { value: 'yellow', type: 'square', color: COLOR_MAP.yellow },
            { value: 'red',    type: 'square', color: COLOR_MAP.red },
            { value: 'flash',  type: 'square', color: COLOR_MAP.flash },
          ]} />
          {segmentKeys.map((k, idx) => (
            <Bar key={k} dataKey={k} stackId="phase" name={k}
              fill="#9ca3af"
              isAnimationActive={false}
              // Per-row color override via shape
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                const fill = (payload._colors && payload._colors[idx]) || '#9ca3af';
                return <rect x={x} y={y} width={width} height={height} fill={fill} />;
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
