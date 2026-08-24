const ContestModel = {
  fields: {
    id: "string",
    matchId: "string",
    name: "string",
    entryFee: "number",
    prizePool: "number",
    maxSpots: "number",
    joinedSpots: "number",
    status: "open|full|live|completed",
    createdAt: "datetime",
    updatedAt: "datetime"
  }
};

module.exports = ContestModel;
