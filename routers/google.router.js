const express = require('express');
const passport = require('passport');
const OauthController = require('./oauth.controller');

const googleRouter = express.Router();

googleRouter.get(
  '/callback',
  passport.authenticate('google'),
  OauthController.redirectGoogle,
);

googleRouter.get(
  '/',
  passport.authenticate('google', { scope: ['email', 'profile'] }),
);

module.exports = googleRouter;
