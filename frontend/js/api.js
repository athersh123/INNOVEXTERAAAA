const API_BASE = 'http://127.0.0.1:8000';

export async function fetchRecords(query) {
  const url = query ? `${API_BASE}/api/search?q=${encodeURIComponent(query)}` : `${API_BASE}/api/records`;
  const res = await fetch(url);
  return res.json();
}

export async function dssEligibility(holderId) {
  const res = await fetch(`${API_BASE}/api/dss/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holder_id: holderId })
  });
  return res.json();
}




