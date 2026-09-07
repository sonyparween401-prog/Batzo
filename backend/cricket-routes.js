const express = require("express");

const {
  getBallByBall,
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
} = require("./cricket");

const { getFallbackLive } = require("./live-fallback");

const router = express.Router();

function rows(payload) {
  return Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
}

function uniqueMatches(list) {
  const result = [];
  const seen = new Set();

  for (const match of list) {
    const id =
      match?.id ||
      `${match?.name || ""}:${match?.dateTimeGMT || match?.date || ""}`;

    if (!id || seen.has(id)) continue;

    seen.add(id);
    result.push(match);
  }

  return result;
}


/* BATZO_MATCH_CLASSIFIERS_V2 */
function batzoTrue(value) {
  return value === true ||
    value === 1 ||
    String(value || "").toLowerCase() === "true";
}

function batzoStatus(match) {
  return String(match?.status || "").trim().toLowerCase();
}

function batzoTime(match) {
  const raw = match?.dateTimeGMT || match?.date || "";
  if (!raw) return NaN;

  const normalized =
    /Z$|[+-]\d\d:\d\d$/.test(raw)
      ? raw
      : `${raw}Z`;

  return Date.parse(normalized);
}

function isEndedMatch(match) {
  const status = batzoStatus(match);

  return batzoTrue(match?.matchEnded) ||
    /\b(won|completed|complete|finished|drawn|abandoned|cancelled|canceled|no result)\b/.test(status);
}

function isLiveMatch(match) {
  if (!match || isEndedMatch(match)) return false;

  const status = batzoStatus(match);
  const time = batzoTime(match);

  /* A future match must never become LIVE because of a bad provider flag. */
  if (
    Number.isFinite(time) &&
    time > Date.now() + 30 * 60 * 1000
  ) {
    return false;
  }

  return batzoTrue(match?.matchStarted) ||
    /\b(live|in progress|innings break|lunch|tea break)\b/.test(status);
}

function isUpcomingMatch(match) {
  if (!match || isEndedMatch(match) || isLiveMatch(match)) {
    return false;
  }

  const status = batzoStatus(match);
  const time = batzoTime(match);

  /* Date is the strongest signal for a scheduled match. */
  if (
    Number.isFinite(time) &&
    time > Date.now() + 5 * 60 * 1000
  ) {
    return true;
  }

  if (!batzoTrue(match?.matchStarted)) {
    return true;
  }

  return /\b(upcoming|scheduled|not started|starts at|match starts)\b/.test(status);
}
/* END BATZO_MATCH_CLASSIFIERS_V2 */

router.get("/matches", async (req, res) => {
  try {
    /*
     * Pull several schedule pages.
     * This broadens coverage beyond only the first few
     * international fixtures.
     */
    const offsets = [0, 25, 50, 75, 100];

    const results = await Promise.allSettled([
      getCurrentMatches(),
      ...offsets.map((offset) => getMatches(offset))
    ]);

    let all = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        all.push(...rows(result.value));
      } else {
        console.warn(
          "CRICKET PAGE:",
          result.reason?.response?.data ||
          result.reason?.message
        );
      }
    }

    all = uniqueMatches(all);

    all.sort((a, b) => {
      const at = Date.parse(
        a?.dateTimeGMT || a?.date || ""
      );

      const bt = Date.parse(
        b?.dateTimeGMT || b?.date || ""
      );

      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;

      return at - bt;
    });

    res.json({
      status: "success",
      count: all.length,
      data: all
    });
  } catch (error) {
    console.error(
      "CRICKET MATCHES:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch cricket matches"
    });
  }
});

router.get("/live", async (req, res) => {
  try {
    const offsets = [0, 25, 50, 75, 100];

    const primaryResults = await Promise.allSettled(
      offsets.map((offset) =>
        getCurrentMatches(offset)
      )
    );

    const primary = [];

    for (const result of primaryResults) {
      if (result.status === "fulfilled") {
        primary.push(...rows(result.value));
      }
    }

    const primaryLive =
      uniqueMatches(primary).filter(isLiveMatch);

    let fallbackLive = [];

    try {
      fallbackLive = await getFallbackLive();
    } catch (error) {
      console.warn(
        "LIVE FALLBACK:",
        error.message
      );
    }

    /*
     * Merge providers and remove obvious duplicate
     * team-vs-team matches.
     */
    const merged = [];
    const seen = new Set();

    for (const match of [
      ...primaryLive,
      ...fallbackLive
    ]) {
      const teams =
        Array.isArray(match?.teams)
          ? match.teams
          : [];

      const key =
        teams.length >= 2
          ? teams
              .slice(0, 2)
              .map((x) =>
                String(x || "")
                  .toLowerCase()
                  .replace(/\s+/g, " ")
                  .trim()
              )
              .sort()
              .join("|")
          : String(match?.id || "");

      if (!key || seen.has(key)) continue;

      seen.add(key);
      merged.push(match);
    }

    res.json({
      status: "success",
      count: merged.length,
      data: merged,
      sources: {
        cricketData: primaryLive.length,
        fallback: fallbackLive.length
      }
    });
  } catch (error) {
    console.error(
      "CRICKET LIVE:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch live cricket data"
    });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const offsets = [0, 25, 50, 75, 100];

    const results = await Promise.allSettled([
      getCurrentMatches(),
      ...offsets.map((offset) => getMatches(offset))
    ]);

    let all = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        all.push(...rows(result.value));
      }
    }

    const upcoming = uniqueMatches(all)
      .filter(isUpcomingMatch)
      .sort((a, b) => {
        const at = batzoTime(a);
        const bt = batzoTime(b);

        if (!Number.isFinite(at)) return 1;
        if (!Number.isFinite(bt)) return -1;
        return at - bt;
      });

    res.json({
      status: "success",
      count: upcoming.length,
      data: upcoming
    });
  } catch (error) {
    console.error(
      "CRICKET UPCOMING:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch upcoming cricket matches"
    });
  }
});

function findBallArray(value, depth = 0) {
  if (depth > 8 || value == null) return null;

  if (Array.isArray(value)) {
    const looksLikeBalls = value.some(
      (item) =>
        item &&
        typeof item === "object" &&
        item.over !== undefined &&
        item.ball !== undefined
    );

    if (looksLikeBalls) return value;

    for (const item of value) {
      const found = findBallArray(item, depth + 1);
      if (found) return found;
    }

    return null;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findBallArray(item, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

router.get("/ball-by-ball/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Match id is required"
      });
    }

    const payload = await getBallByBall(id);

    const match =
      payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload;

    const allBalls =
      findBallArray(match) || [];

    /*
     * Only recent balls are needed by the mobile UI.
     * Never expose the provider API key.
     */
    const recentBalls = allBalls.slice(-24);

    res.json({
      status: "success",
      match: {
        id: match?.id || id,
        name: match?.name || "",
        status: match?.status || "",
        matchStarted: !!match?.matchStarted,
        matchEnded: !!match?.matchEnded,
        score: Array.isArray(match?.score)
          ? match.score
          : []
      },
      count: allBalls.length,
      balls: recentBalls
    });
  } catch (error) {
    console.error(
      "BALL BY BALL:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch ball-by-ball data"
    });
  }
});

router.get("/scorecard/:id", async (req, res) => {
  try {
    res.json(
      await getScorecard(req.params.id)
    );
  } catch (error) {
    console.error(
      "SCORECARD:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch scorecard"
    });
  }
});

router.get("/squad/:id", async (req, res) => {
  try {
    res.json(
      await getSquad(req.params.id)
    );
  } catch (error) {
    console.error(
      "SQUAD:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      error: "Unable to fetch squad"
    });
  }
});

module.exports = router;
