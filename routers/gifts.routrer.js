const express = require('express');

const giftsRouter = express.Router();
const giftsController = require('./gifts.controller');

const authorization = require('../middlewares/auth');

giftsRouter.put('/unpack', authorization,
  giftsController.unpackGift);

module.exports = giftsRouter;
