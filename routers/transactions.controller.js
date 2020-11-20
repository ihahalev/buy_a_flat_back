const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const { transactionModel, familyModel } = require('../database/models');
const { errorHandler, ApiError } = require('../helpers');
const responseNormalizer = require('../normalizers/response-normalizer');

const {
  transactionCategories,
  transactionTypes,
} = require('../database/staticData');

class TransactionController {
  constructor() {}

  async createTransaction(req, res) {
    try {
      const { _id: userId, familyId } = req.user;
      const { amount, type, category, comment } = req.body;
      const defCategory = category ? category : transactionCategories[0].name;
      const {
        _id,
        type: dbType,
        category: dbCategory,
        transactionDate,
      } = await transactionModel.create({
        amount,
        type,
        category: defCategory,
        comment,
        familyId,
        userId: userId,
        transactionDate: Date.now(),
      });
      const monthBalance = await transactionModel.getFamilyMonthBalance(
        familyId,
      );
      const family = await familyModel.findById(familyId);
      if (_id) {
        family.dayLimit -= amount;
        const incomeSavings =
          ((family.totalSalary + family.passiveIncome) *
            family.incomePercentageToSavings) /
          100;
        family.monthLimit = monthBalance - incomeSavings;
        await family.save();
      }
      return responseNormalizer(201, res, {
        _id,
        amount,
        type: dbType,
        category: dbCategory,
        comment,
        transactionDate,
        monthBalance,
        dayLimit: family.dayLimit,
        monthLimit: family.monthLimit,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getCategories(req, res) {
    try {
      return responseNormalizer(200, res, { transactionCategories });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getAnnualStats(req, res) {
    try {
      const { familyId } = req.user;
      const { month, year } = req.query;
      const transes = await transactionModel.getFamilyAnnualReport(
        familyId,
        Number(month),
        Number(year),
      );
      return responseNormalizer(200, res, { transes });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getCurrentMonth(req, res) {
    try {
      const { familyId } = req.user;
      const monthBalance = await transactionModel.getFamilyMonthBalance(
        familyId,
      );
      const { dayLimit, monthLimit } = req.family;
      return responseNormalizer(200, res, {
        monthBalance,
        dayLimit,
        monthLimit,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getDayExpenses(req, res) {
    try {
      const { familyId } = req.user;
      const { date, page = 0, limit = 2 } = req.query;
      const monthBalance = await transactionModel.getDayTransactions(
        familyId,
        date,
        page,
        limit,
      );
      const { dayLimit, monthLimit } = req.family;
      return responseNormalizer(200, res, {
        monthBalance,
        dayLimit,
        monthLimit,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async familyAuthorization(req, res, next) {
    try {
      const { familyId } = req.user;
      if (!familyId) {
        throw new ApiError(403, 'Forbidden', {
          message: 'Not part of a Family',
        });
      }
      const family = familyModel.findById(familyId);
      if (!family) {
        throw new ApiError(403, 'Forbidden', {
          message: 'Not part of a Family',
        });
      }
      req.family = family;
      next();
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  validateTransactionObject(req, res, next) {
    try {
      const { error: validationError } = Joi.object({
        amount: Joi.number().positive().integer().required(),
        type: Joi.string().valid(...transactionTypes),
        category: Joi.alternatives().try(
          Joi.string().valid(...transactionCategories),
          Joi.string().empty('').default(transactionCategories[0]),
        ),
        comment: Joi.string().allow(''),
      }).validate(req.body);

      if (validationError) {
        throw new ApiError(400, 'Bad request', validationError);
      }

      next();
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  validateAnnualStatsQuery(req, res, next) {
    try {
      const { error: validationError } = Joi.object({
        year: Joi.number().positive().integer().min(1970).required(),
        month: Joi.number().positive().integer().min(1).max(12).required(),
      }).validate(req.query);

      if (validationError) {
        throw new ApiError(400, 'Bad request', validationError);
      }

      next();
    } catch (e) {
      errorHandler(req, res, e);
    }
  }
}

module.exports = new TransactionController();
