// Initializes the `users` service on path `/users`
const { authenticate } = require('@feathersjs/authentication').hooks;
const { Service } = require('feathers-sequelize');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;
const crypto = require('crypto');

class Users extends Service {
  create(data, params) {
    const {email, password, githubId, name} = data;
    const avatar = data.avatar || Users.getGravatar(email);
    const userData = {
      email,
      name,
      password,
      githubId,
      avatar
    };
    return super.create(userData, params);
  }

  static getGravatar(email) {
    const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    return `https://s.gravatar.com/avatar/${hash}?s=60`;
  }
}

function createModel(app) {
  const sequelize = app.get('sequelize');
  const users = sequelize.define('users', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
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
  // eslint-disable-next-line no-unused-vars
  users.associate = function (models) {};
  return users;
}


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
  service.hooks({
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
  });
};
