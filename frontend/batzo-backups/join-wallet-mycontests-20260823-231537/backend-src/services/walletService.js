function validAmount(amount) {
  const n = Number(amount);

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid amount.");
  }

  return Number(n.toFixed(2));
}

function debit(balance, amount) {
  const value = validAmount(amount);

  if (Number(balance || 0) < value) {
    throw new Error("Insufficient wallet balance.");
  }

  return Number((Number(balance || 0) - value).toFixed(2));
}

function credit(balance, amount) {
  return Number(
    (Number(balance || 0) + validAmount(amount)).toFixed(2)
  );
}

module.exports = {
  validAmount,
  debit,
  credit
};
