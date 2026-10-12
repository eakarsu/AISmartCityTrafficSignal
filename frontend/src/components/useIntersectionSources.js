import { useEffect, useState } from 'react';
import { intersectionsApi, incidentsApi, specialEventsApi, workZonesApi } from '../services/api';

const catalogs = {
  intersection_id: { table: 'intersections', column: 'intersection_id', api: intersectionsApi },
  intersection_ids: { table: 'intersections', column: 'intersection_id', api: intersectionsApi },
  incident_id: { table: 'incidents', column: 'incident_id', api: incidentsApi },
  event_id: { table: 'special events', column: 'event_id', api: specialEventsApi },
  zone_id: { table: 'work zones', column: 'zone_id', api: workZonesApi },
};

export default function useTrafficSources(fields, values) {
  const keys = fields.map(field => field.key).filter(key => catalogs[key]), identity = keys.sort().join('|');
  const [rows, setRows] = useState({}), [loading, setLoading] = useState(Boolean(identity)), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; if (!identity) return () => { active = false; };
    setLoading(true); setError('');
    const wanted = identity.split('|');
    Promise.all(wanted.map(async key => {
      const catalog = catalogs[key], response = await catalog.api.list();
      const records = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(records)) throw new Error('Saved ' + catalog.table + ' returned an unexpected response.');
      const actual = records.filter(row => typeof row[catalog.column] === 'string' && row[catalog.column].trim());
      if (records.length && !actual.length) throw new Error('Saved ' + catalog.table + ' did not include native reference identifiers.');
      return [key, actual];
    })).then(result => { if (active) setRows(Object.fromEntries(result)); })
      .catch(failure => { if (active) { setRows({}); setError(failure.message || 'Could not load saved traffic sources.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [identity, revision]);
  const selectedIntersection = (rows.intersection_id || []).some(row => row.intersection_id === values.intersection_id) ? values.intersection_id : '';
  const metadata = fields.map(field => {
    const catalog = catalogs[field.key]; if (!catalog) return field;
    let available = rows[field.key] || [];
    if (field.key === 'incident_id' && selectedIntersection && !available.some(row => row.incident_id === values.incident_id)) available = available.filter(row => row.intersection_id === selectedIntersection);
    return { ...field, type: 'select', requiresExistingRecord: true, options: [...new Set(available.map(row => row[catalog.column]))] };
  });
  const missing = metadata.filter(field => catalogs[field.key] && !field.options.length).map(field => field.label);
  const selectedIncident = (rows.incident_id || []).find(row => row.incident_id === values.incident_id);
  const mismatch = selectedIncident && selectedIntersection && selectedIncident.intersection_id && selectedIncident.intersection_id !== selectedIntersection;
  const blocker = !loading && !error && missing.length ? 'No saved sources are available for ' + missing.join(', ') + '. Select or add a permitted native source before generating. Examples never invent identifiers.' : mismatch ? 'The selected incident belongs to another intersection. Select its matching intersection before generating.' : '';
  const matchExample = (filled, current) => {
    if (!identity.includes('incident_id') || !identity.includes('intersection_id')) return filled;
    const incident = (rows.incident_id || []).find(row => row.incident_id === filled.incident_id);
    if (!selectedIntersection && incident && (rows.intersection_id || []).some(row => row.intersection_id === incident.intersection_id)) return { ...filled, intersection_id: incident.intersection_id };
    return filled;
  };
  return { fields: metadata, loading, error, blocker, matchExample, retry: () => setRevision(value => value + 1) };
}
