function requireUser(req, res, next) {
  const userId =
    req.headers["x-user-id"] ||
    req.user?.uid ||
    null;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required."
    });
  }

  req.userId = userId;
  next();
}

function validateAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount.");
  }

  return amount;
}

module.exports = {
  requireUser,
  validateAmount
};
