export const getMatchId = (m = {}) => m.id ?? m.matchId ?? m._id ?? null;
export const getContestId = (c = {}) => c.id ?? c.contestId ?? c._id ?? null;
export const getTeamId = (t = {}) => t.id ?? t.teamId ?? null;
export const teamBelongsToMatch = (team = {}, match = {}) => {
  const mid = getMatchId(match);
  return !!mid && (!team.matchId || String(team.matchId) === String(mid));
};
