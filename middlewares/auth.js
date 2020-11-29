const jwt = require('jsonwebtoken');
const { errorHandler, ApiError } = require('../helpers');
const config = require('../config.env');
const { userModel } = require('../database/models');

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    let id;
    try {
      id = await jwt.verify(token, config.jwtPrivateKey).id;
    } catch (err) {
      throw new ApiError(401, 'User is not authorized', err);
    }

    const user = await userModel.findById(id);

    if (!user) {
      throw new ApiError(401, 'User is not authorized');
    }

    const usedToken = user.tokens.find(
      (tokenRecord) => tokenRecord.token === token,
    );

    if (!usedToken) {
      throw new ApiError(401, 'User is not authorized');
    }

    function checkTokenExpires() {
      return new Date() > new Date(usedToken.expires);
    }
    const isTokenExpired = checkTokenExpires();

    if (isTokenExpired) {
      user.tokens = user.tokens.filter(
        (tokenRecord) => tokenRecord.token !== token,
      );

      await user.save();

      throw new ApiError(403, 'Token expired, please login your account');
    }

    req.user = user;
    req.activeToken = token;

    next();
  } catch (err) {
    errorHandler(req, res, err);
  }
};
