// Initializes the `users` service on path `/users`
const { authenticate } = require('@feathersjs/authentication').hooks;
const { Service } = require('feathers-sequelize');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

// Users Service
const crypto = require('crypto');
const gravatarUrl = 'https://s.gravatar.com/avatar';
const query = 's=60';
const getGravatar = email => {
  const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  return `${gravatarUrl}/${hash}?${query}`;
};
class Users extends Service {
  create(data, params) {
    const { email, password, githubId, name } = data;
    const avatar = data.avatar || getGravatar(email);
    const userData = {
      email,
      name,
      password,
      githubId,
      avatar
    };
    return super.create(userData, params);
  }
};

function createModel(app) {
  const sequelizeClient = app.get('sequelizeClient');
  const users = sequelizeClient.define('users', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    hooks: {
      beforeCount(options) {
        options.raw = true;
      }
    }
  });
  users.associate = function (models) {};
  return users;
};

const hooks = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ authenticate('jwt') ],
    create: [ hashPassword('password') ],
    update: [ hashPassword('password'),  authenticate('jwt') ],
    patch: [ hashPassword('password'),  authenticate('jwt') ],
    remove: [ authenticate('jwt') ]
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect('password')
    ],
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
};

// Entry point to this file.
module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');
  const options = {
    Model,
    paginate
  };
  app.use('/users', new Users(options, app));
  const service = app.service('users');
  service.hooks(hooks);
};
