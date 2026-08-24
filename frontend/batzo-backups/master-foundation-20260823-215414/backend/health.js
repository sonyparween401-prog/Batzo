function health(req, res) {
  res.json({
    ok: true,
    service: "batzo-backend",
    time: new Date().toISOString()
  });
}

module.exports = health;
