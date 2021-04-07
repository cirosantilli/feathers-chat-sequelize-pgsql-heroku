const assert = require('assert');

const app = require('../src/app');
const utils = require('./utils');

describe('authentication', () => {
  it('registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });
  describe('local strategy', () => {
    beforeEach(async () => {
      await app.service('users').create(utils.userInfo);
    });
    it('authenticates user and creates accessToken', async () => {
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        ...utils.userInfo
      });
      assert.ok(accessToken, 'Created access token for user');
      assert.ok(user, 'Includes user in authentication data');
    });
  });
});
