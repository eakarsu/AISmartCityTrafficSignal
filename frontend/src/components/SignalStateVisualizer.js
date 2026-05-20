import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getSignalState, intersectionsApi } from '../services/api';

// Build a flat per-second schedule from phases (each {movement, color, seconds}).
// Returns an array of {ns, ew} entries length == cycle_seconds where each side
// is one of 'green' | 'yellow' | 'red'. While NS is green/yellow, EW is red.
function buildSchedule(phases) {
  if (!phases || !phases.length) return [];
  const schedule = [];
  for (const ph of phases) {
    const secs = Math.max(1, Number(ph.seconds) || 1);
    for (let i = 0; i < secs; i++) {
      if (ph.movement === 'NS') {
        schedule.push({ ns: ph.color, ew: 'red' });
      } else if (ph.movement === 'EW') {
        schedule.push({ ns: 'red', ew: ph.color });
      } else {
        schedule.push({ ns: 'red', ew: 'red' });
      }
    }
  }
  return schedule;
}

function lightColor(color, active) {
  if (!active) return '#1f2937';
  if (color === 'green') return '#16a34a';
  if (color === 'yellow') return '#eab308';
  if (color === 'red') return '#dc2626';
  return '#374151';
}

// One stoplight housing with three lamps. `state` is 'green'|'yellow'|'red'.
function Stoplight({ x, y, state, rotation = 0, label }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <rect x={-12} y={-30} width={24} height={60} rx={4} fill="#111827" stroke="#374151" />
      <circle cx={0} cy={-18} r={6} fill={lightColor('red', state === 'red')} />
      <circle cx={0} cy={0}   r={6} fill={lightColor('yellow', state === 'yellow')} />
      <circle cx={0} cy={18}  r={6} fill={lightColor('green', state === 'green')} />
      {label ? (
        <text x={0} y={45} textAnchor="middle" fontSize="10" fill="#6b7280"
              transform={`rotate(${-rotation})`}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

export default function SignalStateVisualizer() {
  const [intersections, setIntersections] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  // Load intersection list for dropdown
  useEffect(() => {
    let alive = true;
    intersectionsApi.list()
      .then((rows) => {
        if (!alive) return;
        const list = Array.isArray(rows) ? rows : (rows?.items || []);
        setIntersections(list);
        if (list.length && !selectedId) setSelectedId(list[0].intersection_id);
      })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, []);

  // Fetch signal state when selection changes
  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    getSignalState(selectedId)
      .then((d) => { if (alive) { setData(d); setTick(0); } })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [selectedId]);

  // 1 Hz animation tick
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const schedule = useMemo(() => buildSchedule(data?.phases), [data]);
  const cycle = schedule.length || data?.cycle_seconds || 22;
  const idx = schedule.length ? (tick % cycle) : 0;
  const state = schedule[idx] || { ns: 'red', ew: 'red' };

  // Compute time-to-next-phase by scanning forward until light flips on either axis
  const secondsToNext = useMemo(() => {
    if (!schedule.length) return 0;
    let i = 1;
    while (i < cycle) {
      const next = schedule[(idx + i) % cycle];
      if (next.ns !== state.ns || next.ew !== state.ew) return i;
      i += 1;
    }
    return cycle;
  }, [schedule, cycle, idx, state]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Intersection:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#fff',
            minWidth: 240,
          }}
        >
          {intersections.map((ix) => (
            <option key={ix.intersection_id} value={ix.intersection_id}>
              {ix.intersection_id} — {ix.name}
            </option>
          ))}
        </select>
        {data ? (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
            cycle <b>{data.cycle_seconds}s</b>
            {data.plan ? <> · plan <b>{data.plan.plan_id}</b> ({data.plan.period})</> : null}
          </span>
        ) : null}
      </div>

      {err ? <div className="ai-error">{err}</div> : null}
      {!data ? <div>Loading signal state...</div> : (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg
            viewBox="0 0 360 360"
            width="360"
            height="360"
            style={{ background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}
            role="img"
            aria-label={`Signal state for ${data.intersection_id}`}
          >
            {/* Roads (cross shape) */}
            <rect x={0}   y={140} width={360} height={80} fill="#9ca3af" />
            <rect x={140} y={0}   width={80}  height={360} fill="#9ca3af" />

            {/* Lane dividers */}
            <line x1={0} y1={180} x2={140} y2={180} stroke="#facc15" strokeDasharray="8 8" />
            <line x1={220} y1={180} x2={360} y2={180} stroke="#facc15" strokeDasharray="8 8" />
            <line x1={180} y1={0}   x2={180} y2={140} stroke="#facc15" strokeDasharray="8 8" />
            <line x1={180} y1={220} x2={180} y2={360} stroke="#facc15" strokeDasharray="8 8" />

            {/* Center box */}
            <rect x={140} y={140} width={80} height={80} fill="#6b7280" />

            {/* Approaches with stoplights */}
            {/* North approach (top) — controls NS */}
            <Stoplight x={150} y={100} state={state.ns} rotation={180} label="N" />
            {/* South approach (bottom) — controls NS */}
            <Stoplight x={210} y={260} state={state.ns} rotation={0}   label="S" />
            {/* East approach (right) — controls EW */}
            <Stoplight x={260} y={150} state={state.ew} rotation={270} label="E" />
            {/* West approach (left) — controls EW */}
            <Stoplight x={100} y={210} state={state.ew} rotation={90}  label="W" />

            {/* Title */}
            <text x={180} y={20} textAnchor="middle" fontSize="12" fill="#111827" fontWeight="600">
              {data.name || data.intersection_id}
            </text>

            {/* Countdown */}
            <g transform="translate(180, 340)">
              <rect x={-60} y={-16} width={120} height={24} rx={4} fill="#111827" />
              <text x={0} y={2} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="600">
                next phase in {secondsToNext}s
              </text>
            </g>
          </svg>

          <div style={{ minWidth: 220, fontSize: 13, color: '#111827' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Current state</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                background: lightColor(state.ns, true),
              }} />
              N/S movement: <b>{state.ns}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                background: lightColor(state.ew, true),
              }} />
              E/W movement: <b>{state.ew}</b>
            </div>

            <div style={{ fontWeight: 600, marginBottom: 6 }}>Phases</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(data.phases || []).map((p, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {p.movement} {p.color} — <b>{p.seconds}s</b>
                </li>
              ))}
            </ol>
            <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>
              tick {tick}s · cycle index {idx}/{cycle}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
