const express = require('express');
const passport = require('passport');
const OauthController = require('./oauth.controller');

const googleRouter = express.Router();

googleRouter.get(
  '/google/callback',
  passport.authenticate('google'),
  OauthController.redirectGoogle,
);

googleRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }),
);

module.exports = googleRouter;
