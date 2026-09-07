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
