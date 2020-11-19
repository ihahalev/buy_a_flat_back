const log4js = require('log4js');
const configEnv = require('../config.env');

module.exports = (name) => {
  // const logger = log4js.getLogger(name);
  // logger.level = configEnv.logLevel;
  // console.info(configEnv.logLevel);
  return console;
  // return logger;
};
