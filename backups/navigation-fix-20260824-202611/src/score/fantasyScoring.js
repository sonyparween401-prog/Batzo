export const scoringRules = {
  run: 1,
  four: 1,
  six: 2,
  wicket: 25,
  catch: 8,
  stumping: 12,
  runOut: 6,
  captainMultiplier: 2,
  viceCaptainMultiplier: 1.5
};

export function calculatePlayerPoints(stats = {}) {
  let points = 0;

  points += (stats.runs || 0) * scoringRules.run;
  points += (stats.fours || 0) * scoringRules.four;
  points += (stats.sixes || 0) * scoringRules.six;
  points += (stats.wickets || 0) * scoringRules.wicket;
  points += (stats.catches || 0) * scoringRules.catch;
  points += (stats.stumpings || 0) * scoringRules.stumping;
  points += (stats.runOuts || 0) * scoringRules.runOut;

  if (stats.isCaptain) {
    points *= scoringRules.captainMultiplier;
  }

  if (stats.isViceCaptain) {
    points *= scoringRules.viceCaptainMultiplier;
  }

  return points;
}

export function calculateTeamPoints(players = []) {
  return players.reduce(
    (total, player) => total + calculatePlayerPoints(player),
    0
  );
}
