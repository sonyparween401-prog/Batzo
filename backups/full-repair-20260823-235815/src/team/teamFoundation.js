import { validateContestTeam } from "../contest/contestFoundation";

export function createTeam(players, captainId, viceCaptainId) {
  const team = players.map(player => ({
    ...player,
    isCaptain: player.id === captainId,
    isViceCaptain: player.id === viceCaptainId
  }));

  const validation = validateContestTeam(team);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    id: crypto.randomUUID(),
    players: team,
    createdAt: new Date().toISOString()
  };
}
