const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const config = require('../../config.env');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    passwordHash: { type: String },
    familyId: { type: ObjectId, ref: 'Family', default: null },
    tokens: [
      {
        token: { type: String, required: true },
        expires: { type: Date, required: true },
      },
    ],
    verificationToken: { type: String },
  },
  { timestamps: true },
);

UserSchema.static('hashPassword', (password) => {
  const costFactor = 6;
  return bcrypt.hash(password, costFactor);
});

UserSchema.method('isPasswordValid', function (password) {
  return bcrypt.compare(password, this.passwordHash);
});

UserSchema.method('generateAndSaveToken', async function () {
  const token = jsonWebToken.sign({ id: this._id }, config.jwtPrivateKey);

  this.tokens.push({
    token,
    expires: new Date().getTime() + 24 * 60 * 60 * 1e3,
  });
  await this.save();

  return token;
});

module.exports = mongoose.model('User', UserSchema);
