const app = require('../src/app');

exports.mochaGlobalSetup = async function() {
  // This calls sequelize.sync(), which creates the database.
  await app.setup();
};

exports.mochaHooks = {
  // Clear the database before each test.
  async beforeEach() {
    await app.get('sequelize').truncate();
  }
};

exports.userInfo = {
  name: 'Some One',
  email: 'test@example.com',
  password: 'supersecret'
};
