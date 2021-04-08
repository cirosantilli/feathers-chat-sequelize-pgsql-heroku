const sequelize = require('sequelize');

const { authenticate } = require('@feathersjs/authentication').hooks;
const { Service } = require('feathers-sequelize');

class Messages extends Service {
}

function createModel (app) {
  const message = app.get('sequelize').define('messages', {
    text: {
      type: sequelize.STRING,
      allowNull: false
    }
  });
  message.associate = function (models) {
    message.belongsTo(models.users);
  };
  return message;
}

/* eslint-disable require-atomic-updates */
function populateUser(options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    const { app, method, result, params } = context;
    // Function that adds the user to a single message object
    const addUser = async message => {
      // Get the user based on their id, pass the `params` along so
      // that we get a safe version of the user data
      const user = await app.service('users').get(message.userId, params);

      // Merge the message content to include the `user` object
      return {
        ...message,
        user
      };
    };

    // In a find method we need to process the entire page
    if (method === 'find') {
      // Map all data to include the `user` information
      context.result.data = await Promise.all(result.data.map(addUser));
    } else {
      // Otherwise just update the single result
      context.result = await addUser(result);
    }

    return context;
  };
}

function processMessage(options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    const { data } = context;

    // Throw an error if we didn't get a text
    if(!data.text) {
      throw new Error('A message must have a text');
    }

    // The logged in user
    const { user } = context.params;
    // The actual message text
    // Make sure that messages are no longer than 400 characters
    const text = context.data.text.substring(0, 400);

    // Update the original data (so that people can't submit additional stuff)
    context.data = {
      text,
      userId: user.id,
      createdAt: new Date()
    };

    return context;
  };
}

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');
  const options = {
    Model,
    paginate
  };
  app.use('/messages', new Messages(options, app));
  const service = app.service('messages');
  service.hooks({
    before: {
      all: [ authenticate('jwt') ],
      find: [],
      get: [],
      create: [processMessage()],
      update: [],
      patch: [],
      remove: []
    },
    after: {
      all: [populateUser()],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  });
};
