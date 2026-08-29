export const API_CONFIG = {
  baseUrl:
    import.meta.env.VITE_CRICKET_API_URL ||
    "http://127.0.0.1:3000/api",

  endpoints: {
    matches: "/matches",
    live: "/matches/live",
    upcoming: "/matches/upcoming",
    results: "/matches/results",
    players: "/players",
    scorecard: "/matches/:id/scorecard",
    contests: "/contests",
    teams: "/teams",
    wallet: "/wallet",
    transactions: "/wallet/transactions",
    leaderboard: "/contests/:id/leaderboard",
  }
};
