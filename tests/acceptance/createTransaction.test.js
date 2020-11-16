const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const faker = require('faker');
const mongoose = require('mongoose');

const Server = require('../../server');
const {
  transactionModel,
  userModel,
  familyModel,
} = require('../../database/models');
const configEnv = require('../../config.env');
const userTestModel = require('../types/userModel');

describe('POST /api/transactions', () => {
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
      .post('/api/transactions')
      .set('Content-Type', 'application/json')
      .send({})
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

    it('Should throw 403 Forbidden', async () => {
      await supertest
        .agent(server.listen())
        .post('/api/transactions')
        .set('Authorization', token)
        .set('Content-Type', 'application/json')
        .send({})
        .expect(403);
    });

    it('Should throw 400 Bad requiest', async () => {
      user.setFamily(1);
      sinon.replace(familyModel, 'findById', sinon.fake.returns({ _id: 1 }));
      await supertest
        .agent(server.listen())
        .post('/api/transactions')
        .set('Authorization', token)
        .set('Content-Type', 'application/json')
        .send({})
        .expect(400);
    });

    it('Should respond with 201 and create transaction in DB', async () => {
      const id = mongoose.Types.ObjectId();
      user.setId(id);
      const familyId = mongoose.Types.ObjectId();
      user.setFamily(familyId);
      sinon.replace(
        familyModel,
        'findById',
        sinon.fake.returns({ _id: familyId }),
      );
      // sinon.replace(
      //   userModel,
      //   'findOne',
      //   sinon.fake.returns({ _id: id, token, familyId: 1 }),
      // );
      await supertest
        .agent(server.listen())
        .post('/api/transactions')
        .set('Authorization', token)
        .set('Content-Type', 'application/json')
        .send({ amount: '12500' })
        .expect(201);

      const { _id } = await transactionModel.findOne({ userId: id });
      should.exist(_id);
      await transactionModel.findByIdAndDelete(_id);
    });
  });
});
