const express = require('express');
const passport = require('passport');
const OauthController = require('./oauth.controller');

const facebookRouter = express.Router();

facebookRouter.get(
  '/callback',
  passport.authenticate('facebook'),
  OauthController.redirectGoogle,
);

facebookRouter.get(
  '/',
  passport.authenticate('facebook', { scope: ['email'] }),
);

module.exports = facebookRouter;
