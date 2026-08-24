const TeamModel = {
  fields: {
    id: "string",
    userId: "string",
    matchId: "string",
    players: "array",
    captainId: "string",
    viceCaptainId: "string",
    createdAt: "datetime"
  }
};

module.exports = TeamModel;
