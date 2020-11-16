const mongoose = require('mongoose');
const configEnv = require('../config.env');

class Connection {
  constructor() {
    this.connection = null;
    this.database = null;
  }
  getCollection() {
    return this.database.collection(configEnv.dbCollection);
  }
  async connect() {
    const connectionStatePromise = new Promise((reslove, reject) => {
      mongoose.connection.on('error', (e) => {
        console.log('Database connection failed');
        process.exit(1);
      });
      mongoose.connection.on('open', () => {
        console.log('Database connection successful');
        reslove();
      });
    });
    await mongoose.connect(`${configEnv.dbConnectionUrl}/${configEnv.dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    return connectionStatePromise;
  }

  async close() {
    mongoose.connection.close();
  }
}

module.exports = new Connection();
