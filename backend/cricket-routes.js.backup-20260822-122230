const express = require("express");
const router = express.Router();

const {
  getMatches,
  getCurrentMatches,
  getScorecard,
  getSquad
} = require("./cricket");

router.get("/matches", async (req, res) => {
  try {
    res.json(await getMatches());
  } catch (error) {
    console.error("MATCHES:", error.response?.data || error.message);
    res.status(502).json({
      success: false,
      error: "Unable to fetch cricket matches"
    });
  }
});

router.get("/live", async (req, res) => {
  try {
    res.json(await getCurrentMatches());
  } catch (error) {
    console.error("LIVE:", error.response?.data || error.message);
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
