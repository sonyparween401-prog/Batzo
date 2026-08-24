export function validateFantasyTeam(players = []) {
  if (players.length !== 11) {
    return { valid: false, error: "Select exactly 11 players." };
  }

  const captain = players.filter(p => p.isCaptain);
  const vice = players.filter(p => p.isViceCaptain);

  if (captain.length !== 1) {
    return { valid: false, error: "Select one Captain." };
  }

  if (vice.length !== 1) {
    return { valid: false, error: "Select one Vice-Captain." };
  }

  if (captain[0].id === vice[0].id) {
    return {
      valid: false,
      error: "Captain and Vice-Captain must be different."
    };
  }

  return { valid: true, error: null };
}
