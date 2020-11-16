class transactionModel {
  constructor() {
    this._id = 1;
  }

  createTransaction(id) {
    this.id = id;
  }
}

module.exports = transactionModel;
