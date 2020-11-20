const express = require('express');
const router = express.Router();
const transactionsController = require('./transactions.controller');
const authCheck = require('../middlewares/auth');

router.post(
  '/',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.validateTransactionObject,
  transactionsController.createTransaction,
);

router.put(
  '/:transactionId',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.transactionAuthorization,
  transactionsController.validateTransactionUpdate,
  transactionsController.updateTransaction,
);

router.delete(
  '/:transactionId',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.transactionAuthorization,
  transactionsController.deleteTransaction,
);

router.get('/categories', authCheck, transactionsController.getCategories);

router.get(
  '/stats/annual',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.validateAnnualStatsQuery,
  transactionsController.getAnnualStats,
);

router.get(
  '/stats/month',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.validateAnnualStatsQuery,
  transactionsController.getMonthStats,
);

router.get(
  '/month/current',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.getCurrentMonth,
);

router.get(
  '/day',
  authCheck,
  transactionsController.familyAuthorization,
  transactionsController.getDayExpenses,
);

module.exports = router;
