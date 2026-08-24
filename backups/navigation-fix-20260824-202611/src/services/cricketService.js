import { API_CONFIG } from "../api/config";

async function request(path, options = {}) {
  const response = await fetch(
    `${API_CONFIG.baseUrl}${path}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    }
  );

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  return response.json();
}

export const cricketService = {
  live: () => request("/matches/live"),
  upcoming: () => request("/matches/upcoming"),
  results: () => request("/matches/results"),
  players: (matchId) => request(`/matches/${matchId}/players`),
  scorecard: (matchId) => request(`/matches/${matchId}/scorecard`)
};
