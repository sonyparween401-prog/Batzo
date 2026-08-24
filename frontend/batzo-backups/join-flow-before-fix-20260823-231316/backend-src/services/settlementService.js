function calculatePrizePool(entryFee, joinedSpots) {
  return Number(entryFee || 0) * Number(joinedSpots || 0);
}

function settlementTemplate(contest) {
  return {
    contestId: contest.id,
    status: "pending",
    prizePool: calculatePrizePool(
      contest.entryFee,
      contest.joinedSpots
    ),
    winners: []
  };
}

module.exports = {
  calculatePrizePool,
  settlementTemplate
};
