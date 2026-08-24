export const contestRules = {
  minPlayers: 11,
  maxPlayers: 11,
  captainRequired: true,
  viceCaptainRequired: true,
  captainMultiplier: 2,
  viceCaptainMultiplier: 1.5
};

export function validateContestTeam(team = []) {
  if (team.length !== 11) {
    return { valid: false, error: "Exactly 11 players are required." };
  }

  const captain = team.filter(p => p.isCaptain);
  const viceCaptain = team.filter(p => p.isViceCaptain);

  if (captain.length !== 1) {
    return { valid: false, error: "Exactly one Captain is required." };
  }

  if (viceCaptain.length !== 1) {
    return { valid: false, error: "Exactly one Vice-Captain is required." };
  }

  if (captain[0].id === viceCaptain[0].id) {
    return { valid: false, error: "Captain and Vice-Captain must be different." };
  }

  return { valid: true };
}
