const Joi = require('joi');
const uuid = require('uuid').v4;
const { userModel, familyModel } = require('../database/models');
const { ApiError, errorHandler, mailer } = require('../helpers');
const responseNormalizer = require('../normalizers/response-normalizer');
const configEnv = require('../config.env');

class UserController {
  constructor() {}
  async userRegister(req, res) {
    try {
      const { name, email, password } = req.body;

      const user = await userModel.findOne({ email });

      if (user) throw new ApiError(409, 'User with such email already exist');

      const passwordHash = await userModel.hashPassword(password);
      const verificationToken = uuid();

      const { _id } = await userModel.create({
        name,
        email,
        passwordHash,
        verificationToken,
      });

      await mailer.sendVerificationMail(email, verificationToken);

      responseNormalizer(201, res, { id: _id, username: name, email });
    } catch (err) {
      errorHandler(req, res, err);
    }
  }

  //==================================================================

  async userLogin(req, res) {
    try {
      const { email, password } = req.body;

      const foundUser = await userModel.findOne({ email }).populate('familyId');

      if (!foundUser) {
        throw new ApiError(401, 'Email or password is wrong');
      }
      if (foundUser.verificationToken) {
        throw new ApiError(412, 'Email not verified');
      }
      const isValid = await foundUser.isPasswordValid(password);
      if (!isValid) throw new ApiError(401, 'Email or password is wrong');

      const token = await foundUser.generateAndSaveToken();

      const { _id, name, familyId } = foundUser;

      let currentFamily = null;

      if (familyId) {
        const {
          balance,
          flatPrice,
          flatSquareMeters,
          totalSalary,
          passiveIncome,
          incomePercentageToSavings,
          giftsForUnpacking,
        } = familyId;
        currentFamily = {
          balance,
          flatPrice,
          flatSquareMeters,
          totalSalary,
          passiveIncome,
          incomePercentageToSavings,
          giftsForUnpacking,
        };
      }

      responseNormalizer(201, res, {
        user: {
          id: _id,
          username: name,
          email,
          familyId: currentFamily,
        },
        token,
      });
    } catch (err) {
      errorHandler(req, res, err);
    }
  }

  //=============================================

  async verifyEmail(req, res, next) {
    try {
      const { verificationToken } = req.params;

      const foundUser = await userModel.findOne({ verificationToken });

      if (!foundUser) throw new ApiError(404, 'User is not found');

      foundUser.verificationToken = null;

      await foundUser.save();

      res.status(200).redirect(`${configEnv.hostUrl}/`);
    } catch (err) {
      errorHandler(req, res, err);
    }
  }

  //==================================================

  validateUserObject(req, res, next) {
    try {
      const { error: validationError } = Joi.object({
        name: Joi.string(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4),
      }).validate(req.body);

      if (validationError) {
        throw new ApiError(400, 'Bad request', validationError);
      }

      next();
    } catch (e) {
      errorHandler(req, res, e);
    }
  }

  //========================================

  async logout(req, res) {
    try {
      const { activeToken, user } = req;
      await userModel.update(
        { _id: user.id },
        { $pull: { tokens: { token: activeToken } } },
      );
      responseNormalizer(204, res, {});
    } catch (err) {
      errorHandler(req, res, err);
    }
  }

  //==========================

  async getCurrentUser(req, res) {
    try {
      const { _id, name, email, familyId } = req.user;

      const findFamily = await familyModel.findById(familyId);

      let currentFamily = null;

      if (findFamily) {
        const {
          balance,
          flatPrice,
          flatSquareMeters,
          totalSalary,
          passiveIncome,
          incomePercentageToSavings,
          giftsForUnpacking,
        } = findFamily;
        currentFamily = {
          balance,
          flatPrice,
          flatSquareMeters,
          totalSalary,
          passiveIncome,
          incomePercentageToSavings,
          giftsForUnpacking,
        };
      }

      responseNormalizer(200, res, {
        id: _id,
        username: name,
        email,
        familyId: currentFamily,
      });
    } catch (err) {
      errorHandler(req, res, err);
    }
  }
}

module.exports = new UserController();
