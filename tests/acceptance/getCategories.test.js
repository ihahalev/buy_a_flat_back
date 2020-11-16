const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const mongoose = require('mongoose');

const Server = require('../../server');
const { userModel, familyModel } = require('../../database/models');
const configEnv = require('../../config.env');
const userTestModel = require('../types/userModel');

describe('GET /api/transactions/categories', () => {
  let server;
  let token;
  const financeServer = new Server();

  before(async () => {
    server = await financeServer.startTest();
  });

  after(async () => {
    sinon.restore();
    mongoose.connection.close();
  });

  it('Should throw 401 Unauthorized', async () => {
    await supertest
      .agent(server.listen())
      .get('/api/transactions/categories')
      .set('Content-Type', 'application/json')
      .expect(401);
  });

  context('when authorized', () => {
    const user = new userTestModel();
    token = jwt.sign(faker.random.word(), configEnv.jwtPrivateKey);
    user.setToken(token);

    beforeEach(() => {
      sinon.replace(userModel, 'findById', sinon.fake.returns(user));
    });

    afterEach(() => {
      sinon.restore();
    });

    after(() => {
      sinon.restore();
    });

    it('Should respond with 200 and categories array', async () => {
      user.setFamily(1);
      sinon.replace(familyModel, 'findById', sinon.fake.returns({ _id: 1 }));
      const res = await supertest
        .agent(server.listen())
        .get('/api/transactions/categories')
        .set('Authorization', token)
        .set('Content-Type', 'application/json')
        .expect(200);

      should.exist(res.body);
      res.body.should.have.property('transactionCategories').which.is.a.Array();
    });
  });
});
