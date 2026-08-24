export function buildLeaderboard(entries = []) {
  return [...entries]
    .map(entry => ({
      ...entry,
      points: Number(entry.points || 0)
    }))
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}
