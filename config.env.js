require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT,
  secretKey: process.env.PROTECT_KEY,
  dbConnectionUrl: process.env.DB_URL,
  dbName: process.env.DB_NAME,
  dbCollection: process.env.DB_COLLECTION,
  jwtPrivateKey: process.env.TOKEN_PRIVATE_KEY,
  srvUrl: `${process.env.SRV_URL}`,
  hostUrl: `${process.env.HOST_URL}`,
  hostUrl1: `${process.env.HOST_URL1}`,
  allowedOrigin: `${process.env.HOST_URL}`,
  allowedOrigin1: `${process.env.HOST_URL1}`,

  paths: {
    tmp: path.join(process.cwd(), 'tmp'),
    avatars: path.join(process.cwd(), 'public', 'images'),
  },

  logLevel: process.env.LOG_LEVEL,

  mail: {
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },

  swagger: {
    host: `${process.env.SRV_URL}`,
    schemes: ['http'],
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  facebook: {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },

  testUser: {
    email: process.env.TEST_USER_EMAIL,
  },
};
