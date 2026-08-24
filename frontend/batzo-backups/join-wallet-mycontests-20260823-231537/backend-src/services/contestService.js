function canJoinContest(contest) {
  if (!contest) {
    return { ok: false, error: "Contest not found." };
  }

  if (contest.status !== "open") {
    return { ok: false, error: "Contest is not open." };
  }

  if (
    Number(contest.joinedSpots || 0) >=
    Number(contest.maxSpots || 0)
  ) {
    return { ok: false, error: "Contest is full." };
  }

  return { ok: true };
}

function calculateRank(entries = []) {
  return [...entries]
    .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}

module.exports = {
  canJoinContest,
  calculateRank
};
