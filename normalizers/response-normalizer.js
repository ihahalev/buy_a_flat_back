const ApiError = require('../helpers/ApiError');

const responseNormalizer = (status, res, object) => {
  let isError = false;

  if (object instanceof ApiError) {
    isError = true;
  }
  return res.status(status).send(object);
};

module.exports = responseNormalizer;
