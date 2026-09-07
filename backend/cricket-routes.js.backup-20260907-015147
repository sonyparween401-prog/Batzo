const express = require("express");
const router = express.Router();

const {
  getCurrentMatches,
  getScorecard,
  getSquad
} = require("./cricket");

router.get("/matches", async (req, res) => {
  try {
    const data = await getCurrentMatches();
    res.json(data);
  } catch (error) {
    console.error("CRICKET MATCHES:", error.response?.data || error.message);
    res.status(502).json({
      success: false,
      error: "Unable to fetch cricket matches"
    });
  }
});

router.get("/live", async (req, res) => {
  try {
    const data = await getCurrentMatches();

    const matches = Array.isArray(data?.data)
      ? data.data.filter(match => {
          const status = String(match.status || "").toLowerCase();
          const matchType = String(match.matchType || "").toLowerCase();

          return (
            status.includes("live") ||
            status.includes("stumps") ||
            status.includes("innings") ||
            status.includes("day") ||
            status.includes("break") ||
            matchType.includes("live")
          );
        })
      : [];

    res.json({
      status: "success",
      info: data?.info || null,
      data: matches
    });
  } catch (error) {
    console.error("CRICKET LIVE:", error.response?.data || error.message);
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
    console.error("SCORECARD:", error.response?.data || error.message);
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
    console.error("SQUAD:", error.response?.data || error.message);
    res.status(502).json({
      success: false,
      error: "Unable to fetch squad"
    });
  }
});

module.exports = router;
