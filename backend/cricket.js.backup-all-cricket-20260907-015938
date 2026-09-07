const axios = require("axios");

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

/*
 * Shared server cache.
 * Important for CricketData Lifetime Free API hit limits:
 * hundreds of app users can read the same cached response without
 * every phone consuming another provider API hit.
 */
const cache = new Map();

function cacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params || {})}`;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  // Never send the provider API key back to the mobile app/browser.
  const {
    apikey,
    apiKey,
    api_key,
    key,
    ...safePayload
  } = payload;

  return safePayload;
}

async function request(endpoint, params = {}, ttlMs = 0) {
  if (!API_KEY) {
    throw new Error("CRICKET_API_KEY is missing");
  }

  const key = cacheKey(endpoint, params);
  const old = cache.get(key);

  if (old && Date.now() - old.time < ttlMs) {
    return old.data;
  }

  const response = await axios.get(`${BASE_URL}/${endpoint}`, {
    params: {
      apikey: API_KEY,
      offset: 0,
      ...params
    },
    timeout: 15000
  });

  const data = sanitizePayload(response.data);

  if (ttlMs > 0) {
    cache.set(key, {
      time: Date.now(),
      data
    });
  }

  return data;
}

async function getMatches() {
  return request("matches", {}, 30 * 60 * 1000);
}

async function getCurrentMatches() {
  return request("currentMatches", {}, 30 * 60 * 1000);
}

async function getScorecard(id) {
  return request("match_scorecard", { id }, 5 * 60 * 1000);
}

async function getSquad(id) {
  return request("match_squad", { id }, 6 * 60 * 60 * 1000);
}

module.exports = {
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
};
