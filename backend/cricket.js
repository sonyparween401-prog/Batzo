const axios = require("axios");

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

const cache = new Map();

function cacheKey(endpoint, params = {}) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  const clean = {};

  for (const [key, value] of Object.entries(payload)) {
    const lower = String(key).toLowerCase();

    if (
      lower === "apikey" ||
      lower === "api_key" ||
      lower === "api-key"
    ) {
      continue;
    }

    clean[key] = sanitizePayload(value);
  }

  return clean;
}

async function request(endpoint, params = {}, ttlMs = 0) {
  if (!API_KEY) {
    throw new Error("CRICKET_API_KEY is missing");
  }

  const key = cacheKey(endpoint, params);
  const existing = cache.get(key);

  if (existing && Date.now() - existing.time < ttlMs) {
    return existing.data;
  }

  const response = await axios.get(
    `${BASE_URL}/${endpoint}`,
    {
      params: {
        apikey: API_KEY,
        ...params
      },
      timeout: 20000
    }
  );

  const safeData = sanitizePayload(response.data);

  if (ttlMs > 0) {
    cache.set(key, {
      time: Date.now(),
      data: safeData
    });
  }

  return safeData;
}

/*
 * Current/live data:
 * cache 30 minutes to protect Lifetime Free quota.
 */
async function getCurrentMatches() {
  return request(
    "currentMatches",
    { offset: 0 },
    30 * 60 * 1000
  );
}

/*
 * Scheduled matches:
 * multiple pages allow Batzo to discover international,
 * domestic, women's and Indian/state fixtures when
 * CricketData exposes them.
 *
 * Cache each page for 6 hours.
 */
async function getMatches(offset = 0) {
  return request(
    "matches",
    { offset },
    6 * 60 * 60 * 1000
  );
}

async function getScorecard(id) {
  return request(
    "match_scorecard",
    { id },
    5 * 60 * 1000
  );
}

async function getSquad(id) {
  return request(
    "match_squad",
    { id },
    6 * 60 * 60 * 1000
  );
}

module.exports = {
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
};
