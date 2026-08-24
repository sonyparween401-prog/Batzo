const API_BASE =
  import.meta.env.VITE_CRICKET_API_BASE ||
  "";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Cricket API HTTP ${response.status}`);
  }

  const json = await response.json();

  if (json && json.status && String(json.status).toLowerCase() !== "success") {
    throw new Error(json.message || "Cricket API returned an error");
  }

  return json;
}

export async function getMatches() {
  return request("/matches");
}

export async function getLiveMatches() {
  return request("/live");
}

export async function getScorecard(matchId) {
  return request(`/scorecard/${encodeURIComponent(matchId)}`);
}

export async function getSquad(matchId) {
  return request(`/squad/${encodeURIComponent(matchId)}`);
}

export function normalizeMatch(match) {
  return {
    id: match?.id || match?.matchId || "",
    name: match?.name || "Cricket Match",
    matchType: match?.matchType || "",
    status: match?.status || "",
    venue: match?.venue || "",
    date: match?.date || match?.dateTimeGMT || "",
    dateTimeGMT: match?.dateTimeGMT || "",
    teams: Array.isArray(match?.teams) ? match.teams : [],
    teamInfo: Array.isArray(match?.teamInfo) ? match.teamInfo : [],
    score: Array.isArray(match?.score) ? match.score : []
  };
}

export function normalizePlayer(player) {
  return {
    id: player?.id || player?.playerId || "",
    name: player?.name || "Unknown Player",
    role: player?.role || "",
    battingStyle: player?.battingStyle || "",
    bowlingStyle: player?.bowlingStyle || "",
    country: player?.country || "",
    image: player?.image || ""
  };
}
