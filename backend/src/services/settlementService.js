function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function calculatePrizePool(entryFee, joinedSpots) {
  return money(
    Number(entryFee || 0) *
    Number(joinedSpots || 0)
  );
}

function rankEntries(entries) {
  const sorted = [...entries].sort((a, b) => {
    const pointsDiff =
      Number(b.points || 0) -
      Number(a.points || 0);

    if (pointsDiff !== 0) return pointsDiff;

    return new Date(a.createdAt || a.created_at || 0) -
      new Date(b.createdAt || b.created_at || 0);
  });

  let rank = 0;
  let previousPoints = null;

  for (let index = 0; index < sorted.length; index++) {
    const entry = sorted[index];
    const points = Number(entry.points || 0);

    if (
      previousPoints === null ||
      points !== previousPoints
    ) {
      rank = index + 1;
    }

    entry.rank = rank;
    previousPoints = points;
  }

  return sorted;
}

function calculatePrize(prizePool, rank) {
  const pool = money(prizePool);

  if (rank === 1) return money(pool * 0.50);
  if (rank === 2) return money(pool * 0.30);
  if (rank === 3) return money(pool * 0.20);

  return 0;
}

function settlementTemplate(contest) {
  const entryFee =
    Number(contest.entryFee ??
    contest.entry_fee ?? 0);

  const joinedSpots =
    Number(contest.joinedSpots ??
    contest.joined_spots ?? 0);

  return {
    contestId: contest.id,
    status: 'pending',
    prizePool: calculatePrizePool(
      entryFee,
      joinedSpots
    ),
    winners: []
  };
}

function settleContest(contest, entries) {
  const entryFee =
    Number(contest.entryFee ??
    contest.entry_fee ?? 0);

  const rankedEntries =
    rankEntries(entries);

  const prizePool =
    calculatePrizePool(
      entryFee,
      rankedEntries.length
    );

  const winners = [];

  for (const entry of rankedEntries) {
    const prize =
      calculatePrize(
        prizePool,
        Number(entry.rank)
      );

    entry.prize = prize;

    if (prize > 0) {
      entry.status = 'winner';

      winners.push({
        entryId: entry.id,
        userId: String(
          entry.userId ??
          entry.user_id
        ),
        rank: entry.rank,
        points: Number(entry.points || 0),
        prize
      });
    } else {
      entry.status = 'completed';
    }
  }

  return {
    contestId: contest.id,
    status: 'settled',
    prizePool,
    winners,
    entries: rankedEntries
  };
}

module.exports = {
  money,
  calculatePrizePool,
  rankEntries,
  calculatePrize,
  settlementTemplate,
  settleContest
};
