const PlayerModel = {
  fields: {
    id: "string",
    externalId: "string",
    name: "string",
    team: "string",
    role: "WK|BAT|AR|BOWL",
    photo: "string",
    stats: "object"
  }
};

module.exports = PlayerModel;
