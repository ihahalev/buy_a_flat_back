const { userModel } = require('../database/models');
const configEnv = require('../config.env');

class GoogleController {
  constructor() {}
  async findOrCreate(profile, callback) {
    try {
      const { email } = profile._json;
      const displayName = email.substring(0, email.indexOf('@'));
      const user = await userModel.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name: displayName,
          },
        },
        { upsert: true, new: true },
      );
      const token = await user.generateAndSaveToken();
      callback(null, { token, email });
    } catch (err) {
      callback(err, null);
    }
  }

  redirectGoogle(req, res) {
    const { token, email } = req.user;
    const host = configEnv.hostUrl;
    const hostLocal = configEnv.hostUrl1;

    email === configEnv.testUser.email
      ? res.redirect(`${hostLocal}/?token=${token}`)
      : res.redirect(`${host}/?token=${token}`);
  }
}
module.exports = new GoogleController();
