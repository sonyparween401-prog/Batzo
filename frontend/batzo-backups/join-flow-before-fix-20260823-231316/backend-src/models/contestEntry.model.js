const ContestEntryModel = {
  fields: {
    id: "string",
    contestId: "string",
    userId: "string",
    teamId: "string",
    entryFee: "number",
    points: "number",
    rank: "number",
    prize: "number",
    status: "joined|ranked|settled"
  }
};

module.exports = ContestEntryModel;
