const configEnv = require('../config.env');

module.exports = {
  clientID: configEnv.facebook.clientID,
  clientSecret: configEnv.facebook.clientSecret,
  callbackURL: `${configEnv.srvUrl}/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name'],
};
