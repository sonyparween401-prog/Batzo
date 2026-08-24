export const walletTypes = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  ENTRY_FEE: "entry_fee",
  WINNING: "winning",
  REFUND: "refund"
};

export function validateWalletTransaction(tx) {
  if (!tx || Number(tx.amount) <= 0) {
    return { valid: false, error: "Invalid transaction amount." };
  }

  if (!walletTypes[tx.type?.toUpperCase()]) {
    return { valid: false, error: "Invalid transaction type." };
  }

  return { valid: true };
}
