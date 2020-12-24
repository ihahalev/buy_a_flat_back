const express = require('express');
const basicRouter = express.Router();

basicRouter.get('/', (req, res) =>
  res.status(200).json({ message: 'buy a flat alive' }),
);

module.exports = basicRouter;
