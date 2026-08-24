class PaymentProvider {
  async createDeposit() {
    throw new Error("Payment provider is not configured.");
  }

  async verifyPayment() {
    throw new Error("Payment provider is not configured.");
  }

  async createWithdrawal() {
    throw new Error("Payment provider is not configured.");
  }
}

module.exports = PaymentProvider;
