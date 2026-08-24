const BALANCE = "batzo_wallet_balance";
const TX = "batzo_wallet_transactions";

export function getWalletBalance() {
  const value = Number(localStorage.getItem(BALANCE));
  return Number.isFinite(value) ? value : 0;
}

export function getWalletTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TX) || "[]");
  } catch {
    return [];
  }
}

export function recordDemoTransaction(type,amount) {

  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Invalid amount");

  let balance = getWalletBalance();

  if (type === "CREDIT") {
    balance += value;
  }

  if (type === "DEBIT") {
    if (balance < value)
      throw new Error("Insufficient balance");

    balance -= value;
  }

  localStorage.setItem(BALANCE,String(balance));

  const tx = getWalletTransactions();

  tx.unshift({
    id:"tx-" + Date.now(),
    type,
    amount:value,
    createdAt:new Date().toISOString()
  });

  localStorage.setItem(TX,JSON.stringify(tx));

  return balance;
}
