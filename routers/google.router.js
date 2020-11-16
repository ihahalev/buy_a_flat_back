const express = require('express');
const passport = require('passport');
const googleController = require('./google.controller');

const googleRouter = express.Router();

googleRouter.get(
  '/google/callback',
  passport.authenticate('google'),
  googleController.redirectGoogle,
);

googleRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }),
);

module.exports = googleRouter;
