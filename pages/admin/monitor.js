import React, { useState, useEffect } from 'react';

const PASSWORD = 'abl';

function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')));
  return csv.join('\n');
}

export default function AdminMonitor() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [coverage, setCoverage] = useState(null);
  const [fallbacks, setFallbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the deployed Cloudflare Worker API URL
      const apiBaseUrl = 'https://ilearn-api.nicoletterankin.workers.dev';
      
      const response = await fetch(`${apiBaseUrl}/v1/monitor/lesson-coverage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch monitoring data');
      }

      setCoverage(data);
      
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError(err.message || 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetchMonitoringData();
  }, [authed]);

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Admin Monitor Login</h1>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 mb-2" />
        <button onClick={() => setAuthed(password === PASSWORD)} className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
        {password && password !== PASSWORD && <div className="text-red-500 mt-2">Incorrect password</div>}
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Lesson Coverage Dashboard</h1>
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button onClick={fetchMonitoringData} className="bg-blue-500 text-white px-4 py-2 rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Lesson Coverage Dashboard</h1>
      {coverage && (
        <div className="mb-6">
          <div className="text-xl font-semibold">Coverage: {coverage.coverage_percentage}% ({coverage.status})</div>
          <div>Total Expected: {coverage.total_expected}, Existing: {coverage.existing}, Missing: {coverage.missing}</div>
          <div>Date: {coverage.date}, Day of Year: {coverage.day_of_year}</div>
          <button className="bg-green-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
            const blob = new Blob([toCSV(coverage.missing_lessons)], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'missing_lessons.csv'; a.click();
          }}>Export Missing (CSV)</button>
          <button className="bg-green-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
            const blob = new Blob([JSON.stringify(coverage.missing_lessons, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'missing_lessons.json'; a.click();
          }}>Export Missing (JSON)</button>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-2">Fallback Events</h2>
      <div className="text-gray-600 mb-4">Fallback events are logged to the Worker console and can be viewed in Cloudflare logs.</div>
      <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
        const blob = new Blob([toCSV(fallbacks)], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fallback_events.csv'; a.click();
      }}>Export Fallbacks (CSV)</button>
      <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => {
        const blob = new Blob([JSON.stringify(fallbacks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fallback_events.json'; a.click();
      }}>Export Fallbacks (JSON)</button>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Timestamp</th>
              <th className="border px-2 py-1">Lesson ID</th>
              <th className="border px-2 py-1">Error Type</th>
              <th className="border px-2 py-1">Error Message</th>
            </tr>
          </thead>
          <tbody>
            {fallbacks.map((e, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{e.timestamp}</td>
                <td className="border px-2 py-1">{e.lesson_id}</td>
                <td className="border px-2 py-1">{e.error_type}</td>
                <td className="border px-2 py-1">{e.error_message || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 