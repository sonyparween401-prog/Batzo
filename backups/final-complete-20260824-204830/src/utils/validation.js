export function validTeam(players) {
  return Array.isArray(players) && players.length === 11;
}

export function validCaptain(players, captainId, viceCaptainId) {
  if (!Array.isArray(players)) return false;
  if (!captainId || !viceCaptainId) return false;
  if (captainId === viceCaptainId) return false;

  const ids = new Set(players.map(p => p.id));

  return ids.has(captainId) && ids.has(viceCaptainId);
}

export function validContestEntry(amount) {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0;
}
