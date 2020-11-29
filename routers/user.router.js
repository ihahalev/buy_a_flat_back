const express = require('express');
const authorization = require('../middlewares/auth');
const userController = require('./user.controller');

const userRouter = express.Router();

userRouter.post(
  '/sign-up',
  userController.validateUserObject,
  userController.userRegister,
);

userRouter.post(
  '/sign-in',
  userController.validateUserObject,
  userController.userLogin,
);

userRouter.delete('/sign-out', authorization, userController.logout);

userRouter.get('/current', authorization, userController.getCurrentUser);

userRouter.get('/verify/:verificationToken', userController.verifyEmail);

module.exports = userRouter;
