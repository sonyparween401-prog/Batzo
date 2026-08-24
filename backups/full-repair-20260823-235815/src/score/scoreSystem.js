export function normalizeScore(score = {}) {
  return {
    runs: Number(score.runs || 0),
    wickets: Number(score.wickets || 0),
    overs: String(score.overs ?? "0.0"),
    innings: Number(score.innings || 1),
    status: score.status || "UNKNOWN",
    batsmen: Array.isArray(score.batsmen) ? score.batsmen : [],
    bowlers: Array.isArray(score.bowlers) ? score.bowlers : []
  };
}

export function buildScoreboard(match = {}) {
  return {
    team1: match.team1 || {},
    team2: match.team2 || {},
    score1: normalizeScore(match.score1),
    score2: normalizeScore(match.score2),
    status: match.status || "UPCOMING"
  };
}

export function buildScorecard(data = {}) {
  return {
    batting: Array.isArray(data.batting) ? data.batting : [],
    bowling: Array.isArray(data.bowling) ? data.bowling : [],
    fallOfWickets: Array.isArray(data.fallOfWickets)
      ? data.fallOfWickets
      : [],
    partnerships: Array.isArray(data.partnerships)
      ? data.partnerships
      : []
  };
}
