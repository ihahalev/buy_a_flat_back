const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const FacebookStrategy = require('passport-facebook');
const configEnv = require('./config.env');
const {
  usersRouter,
  familiesRouter,
  giftsRouter,
  transactionsRouter,
  googleRouter,
  facebookRouter,
} = require('./routers');

const getIncrementBalance = require('./cron/getIncrementBalance');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/index');
const oauthController = require('./routers/oauth.controller');
const { mailer, getLogger, googleCred, facebookCred } = require('./helpers');
const connection = require('./database/Connection');

const logger = getLogger('Server');
module.exports = class Server {
  constructor() {
    this.server = null;
  }

  async startTest() {
    await mailer.init();
    await connection.connect();
    this.initServer();
    this.initMiddlewares();
    this.initRoutes();
    this.initCron();
    return this.server;
  }

  async start() {
    await mailer.init();
    await connection.connect();
    this.initServer();
    this.initMiddlewares();
    this.initRoutes();
    this.initCron();
    const retListen = this.startListening();
    process.on('SIGILL', () => {
      connection.close();
    });
    return retListen;
  }

  async close() {
    return connection.close;
  }

  initServer() {
    this.server = express();
  }

  initMiddlewares() {
    this.server.use(morgan('tiny'));
    this.server.use(express.json());
    this.server.use(
      cors({ origin: [configEnv.allowedOrigin, configEnv.allowedOrigin1] }),
    );
    this.server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.server.use(passport.initialize());
    this.server.use(passport.session());
  }

  initCron() {
    getIncrementBalance();
  }

  initRoutes() {
    this.server.use('/', express.static(path.join(__dirname, 'public')));
    this.server.use('/api/users', usersRouter);
    this.server.use('/api/transactions', transactionsRouter);
    this.server.use('/api/families', familiesRouter);
    this.server.use('/api/gifts', giftsRouter);
    this.server.use('/auth/facebook', facebookRouter);
    this.server.use('/auth', googleRouter);
    passport.use(
      new GoogleStrategy(googleCred, function (
        accessToken,
        refreshToken,
        profile,
        done,
      ) {
        oauthController.findOrCreate(profile, function (err, user) {
          done(err, user);
        });
      }),
    );
    passport.use(
      new FacebookStrategy(facebookCred, function (
        accessToken,
        refreshToken,
        profile,
        done,
      ) {
        oauthController.findOrCreate(profile, function (err, user) {
          done(err, user);
        });
      }),
    );
    passport.serializeUser(function (user, done) {
      done(null, user);
    });
    passport.deserializeUser(function (user, done) {
      done(null, user);
    });
  }

  startListening() {
    return this.server.listen(configEnv.port, (err) => {
      if (err) {
        return logger.error(err);
      }

      logger.info('server started at port', configEnv.port);
    });
  }
};
