const BASE =
  import.meta.env.VITE_CRICKET_API_URL ||
  "http://127.0.0.1:3101/api";

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Cricket API error: ${response.status}`);
  }

  return response.json();
}

export const cricketApi = {
  live: () => api("/matches/live"),
  upcoming: () => api("/matches/upcoming"),
  results: () => api("/matches/results"),
  match: id => api(`/matches/${id}`),
  players: id => api(`/matches/${id}/players`),
  scorecard: id => api(`/matches/${id}/scorecard`)
};
