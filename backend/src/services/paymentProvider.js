class PaymentProvider {
  async createDeposit() {
    throw new Error(
      "Payment provider credentials are not configured."
    );
  }

  async verifyPayment() {
    throw new Error(
      "Payment verification provider is not configured."
    );
  }

  async createWithdrawal() {
    throw new Error(
      "Withdrawal provider is not configured."
    );
  }
}

module.exports = PaymentProvider;
