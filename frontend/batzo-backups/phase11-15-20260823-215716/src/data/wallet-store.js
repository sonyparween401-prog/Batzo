const BALANCE_KEY = "batzo_wallet_balance";
const TX_KEY = "batzo_wallet_transactions";

export function getBalance() {
  const value = Number(localStorage.getItem(BALANCE_KEY));
  return Number.isFinite(value) ? value : 0;
}

export function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TX_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addDemoTransaction(type, amount) {
  const balance = getBalance();
  const next = type === "CREDIT"
    ? balance + Number(amount)
    : Math.max(0, balance - Number(amount));

  localStorage.setItem(BALANCE_KEY, String(next));

  const transactions = getTransactions();

  transactions.unshift({
    id: "tx-" + Date.now(),
    type,
    amount: Number(amount),
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(TX_KEY, JSON.stringify(transactions));

  return next;
}
