class ExpressRes {
  constructor() {
    this.status = 200;
  }

  status(code) {
    this.status = code;
    return this;
  }

  send({ success, data, status }) {
    this.status = status;
  }
}

module.exports = ExpressRes;
