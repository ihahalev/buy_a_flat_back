class userModel {
  constructor() {
    this._id = 1;
    this.tokens = [{ token: 0, expires: Date.now() + 24 * 60 * 60 * 1e3 }];
    this.familyId = 0;
  }

  setId(id) {
    this._id = id;
    return this;
  }

  setToken(token) {
    this.tokens[0].token = token;
    return this;
  }
  setFamily(familyId) {
    this.familyId = familyId;
    return this;
  }
}

module.exports = userModel;
