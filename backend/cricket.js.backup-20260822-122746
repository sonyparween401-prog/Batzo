const axios = require("axios");

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

async function request(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error("CRICKET_API_KEY is missing");
  }

  const response = await axios.get(`${BASE_URL}/${endpoint}`, {
    params: {
      apikey: API_KEY,
      offset: 0,
      ...params
    },
    timeout: 15000
  });

  return response.data;
}

async function getMatches() {
  return request("matches");
}

async function getCurrentMatches() {
  return request("currentMatches");
}

async function getScorecard(id) {
  return request("match_scorecard", { id });
}

async function getSquad(id) {
  return request("match_squad", { id });
}

module.exports = {
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
};
