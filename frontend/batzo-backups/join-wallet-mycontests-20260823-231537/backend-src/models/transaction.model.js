const TransactionModel = {
  fields: {
    id: "string",
    userId: "string",
    type: "deposit|withdrawal|entry_fee|winning|refund",
    amount: "number",
    status: "pending|success|failed|reversed",
    reference: "string",
    createdAt: "datetime"
  }
};

module.exports = TransactionModel;
