class ExpressReq {
  constructor() {
    this.Authorization = 0;
  }

  set(token) {
    this.Authorization = token;
    return this;
  }

  get(authField) {
    return this[authField];
  }
}

module.exports = ExpressReq;
