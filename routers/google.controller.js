const { userModel } = require('../database/models');
const configEnv = require('../config.env');

class GoogleController {
  constructor() {}
  async findOrCreate(profile, callback) {
    try {
      const { email } = profile._json;
      console.log(email);
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
      callback(null, { token });
    } catch (err) {
      callback(err, null);
    }
  }

  redirectGoogle(req, res) {
    const token = req.user.token;
    const refer = req.headers.referer;
    const host = configEnv.hostUrl;
    const hostLocal = configEnv.hostUrl1;
    console.log('headers', req.headers);
    console.log('refer', refer);
    if (refer === 'https://accounts.google.com/') {
      console.log('google');
      res.redirect(`${host}/?token=${token}`);
    } else if (refer === host) {
      console.log('host');
      res.redirect(`${host}/?token=${token}`);
    } else if (refer === hostLocal) {
      console.log('local');
      res.redirect(`${hostLocal}/?token=${token}`);
    }
  }
}
module.exports = new GoogleController();
