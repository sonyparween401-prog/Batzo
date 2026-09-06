const express = require("express");

const {
  getBallByBall,
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
} = require("./cricket");

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
    const data = await getCurrentMatches();

    const live = rows(data).filter(
      (match) =>
        match?.matchStarted === true &&
        match?.matchEnded !== true
    );

    res.json({
      status: "success",
      count: live.length,
      data: live
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
