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
      const {
        monthBalance,
        expToday,
      } = await transactionModel.getFamilyMonthBalance(familyId);
      const family = await familyModel.findById(familyId);
      if (_id) {
        family.dayLimit -= expToday;
        family.monthLimit -= expToday;
      }
      console.log('createTransaction', family.dayLimit, family.monthLimit);
      return responseNormalizer(201, res, {
        _id,
        amount,
        type: dbType,
        category: dbCategory,
        comment,
        transactionDate,
        monthBalance: monthBalance - expToday,
        dayLimit: family.dayLimit,
        monthLimit: family.monthLimit,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async updateTransaction(req, res) {
    try {
      const transaction = req.transaction;
      const { amount, category, comment } = req.body;
      const updateFields = {};

      if (amount) {
        transaction.amount = amount;
        updateFields.amount = amount;
      }
      if (category) {
        transaction.category = category;
        updateFields.category = category;
      }
      if (comment) {
        transaction.comment = comment;
        updateFields.comment = comment;
      }
      await transaction.save();
      return responseNormalizer(200, res, updateFields);
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async deleteTransaction(req, res) {
    try {
      const transaction = req.transaction;
      await transaction.remove();
      return responseNormalizer(200, res, 'deleted');
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
      const annualReport = await transactionModel.getFamilyAnnualReport(
        familyId,
        Number(month),
        Number(year),
      );
      return responseNormalizer(200, res, { annualReport });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getMonthStats(req, res) {
    try {
      const { familyId } = req.user;
      const { month, year } = req.query;
      const monthReport = await transactionModel.getFamilyMonthReport(
        familyId,
        Number(month),
        Number(year),
      );
      return responseNormalizer(200, res, { monthReport });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getCurrentMonth(req, res) {
    try {
      const { familyId } = req.user;
      const {
        monthBalance,
        expToday,
      } = await transactionModel.getFamilyMonthBalance(familyId);
      const { dayLimit, monthLimit } = req.family;
      return responseNormalizer(200, res, {
        monthBalance: monthBalance - expToday,
        dayLimit: dayLimit - expToday,
        monthLimit: monthLimit - expToday,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async getDayExpenses(req, res) {
    try {
      const { familyId } = req.user;
      const { date, page = 0, limit = 8 } = req.query;
      const dayRecords = await transactionModel.getDayRecords(
        familyId,
        date,
        page,
        limit,
      );
      return responseNormalizer(200, res, {
        dayRecords,
      });
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async familyAuthorization(req, res, next) {
    try {
      const { familyId } = req.user;
      if (!familyId) {
        throw new ApiError(403, 'Not part of a Family');
      }
      const family = await familyModel.findById(familyId);
      if (!family) {
        throw new ApiError(403, 'Not part of a Family');
      }
      req.family = family;
      next();
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  async transactionAuthorization(req, res, next) {
    try {
      const user = req.user;
      const { transactionId } = req.params;

      const transaction = await transactionModel.findById(transactionId);

      if (!transaction) {
        throw new ApiError(404, 'Transaction is not found');
      }
      if (`${transaction.userId}` !== `${user._id}`) {
        throw new ApiError(403, 'Not of user transaction');
      }
      req.transaction = transaction;
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

  validateTransactionUpdate(req, res, next) {
    try {
      const { error: validationError } = Joi.object({
        amount: Joi.number().positive().integer(),
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
