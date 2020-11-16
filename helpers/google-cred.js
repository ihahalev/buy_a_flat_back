const configEnv = require('../config.env');

module.exports = {
  clientID: configEnv.google.clientId,
  clientSecret: configEnv.google.clientSecret,
  callbackURL: `${configEnv.srvUrl}/auth/google/callback`,
};
