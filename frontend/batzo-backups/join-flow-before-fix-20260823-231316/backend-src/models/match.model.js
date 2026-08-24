const MatchModel = {
  fields: {
    id: "string",
    externalId: "string",
    team1: "object",
    team2: "object",
    status: "upcoming|live|completed",
    venue: "string",
    startTime: "datetime",
    score: "object",
    updatedAt: "datetime"
  }
};

module.exports = MatchModel;
