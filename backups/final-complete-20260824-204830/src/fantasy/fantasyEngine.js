export const FANTASY_RULES = {
  run: 1,
  fourBonus: 1,
  sixBonus: 2,
  wicket: 25,
  catch: 8,
  stumping: 12,
  runOut: 6,
  captainMultiplier: 2,
  viceCaptainMultiplier: 1.5
};

export function playerPoints(stats = {}) {
  let points = 0;

  points += Number(stats.runs || 0) * FANTASY_RULES.run;
  points += Number(stats.fours || 0) * FANTASY_RULES.fourBonus;
  points += Number(stats.sixes || 0) * FANTASY_RULES.sixBonus;
  points += Number(stats.wickets || 0) * FANTASY_RULES.wicket;
  points += Number(stats.catches || 0) * FANTASY_RULES.catch;
  points += Number(stats.stumpings || 0) * FANTASY_RULES.stumping;
  points += Number(stats.runOuts || 0) * FANTASY_RULES.runOut;

  if (stats.isCaptain) {
    points *= FANTASY_RULES.captainMultiplier;
  } else if (stats.isViceCaptain) {
    points *= FANTASY_RULES.viceCaptainMultiplier;
  }

  return Number(points.toFixed(2));
}

export function teamPoints(players = []) {
  return players.reduce(
    (sum, player) => sum + playerPoints(player),
    0
  );
}
