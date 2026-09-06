const express = require("express");

const {
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

router.get("/matches", async (req, res) => {
  try {
    /*
     * currentMatches gives live/recent matches.
     * matches gives scheduled/upcoming matches.
     * Merge both so Batzo receives one real list.
     */
    const [currentResult, scheduleResult] =
      await Promise.allSettled([
        getCurrentMatches(),
        getMatches()
      ]);

    const current =
      currentResult.status === "fulfilled"
        ? rows(currentResult.value)
        : [];

    const scheduled =
      scheduleResult.status === "fulfilled"
        ? rows(scheduleResult.value)
        : [];

    const merged = [];
    const seen = new Set();

    for (const match of [...current, ...scheduled]) {
      const id =
        match?.id ||
        `${match?.name || ""}-${match?.dateTimeGMT || match?.date || ""}`;

      if (seen.has(id)) continue;

      seen.add(id);
      merged.push(match);
    }

    res.json({
      status: "success",
      data: merged,
      count: merged.length
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

    const matches = rows(data).filter(
      (match) =>
        match?.matchStarted === true &&
        match?.matchEnded !== true
    );

    res.json({
      status: "success",
      data: matches
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

router.get("/scorecard/:id", async (req, res) => {
  try {
    res.json(await getScorecard(req.params.id));
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
    res.json(await getSquad(req.params.id));
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
