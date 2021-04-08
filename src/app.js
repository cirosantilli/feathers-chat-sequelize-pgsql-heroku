const Sequelize = require('sequelize');
const compress = require('compression');
const cors = require('cors');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const path = require('path');

const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');

const logger = require('./logger');
const services = require('./services');

const app = express(feathers());
app.configure(configuration());
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

// Sequelize.
{
  let sequelizeParams = {
    logging: false,
    define: {
      freezeTableName: true
    },
  };
  if (process.env.NODE_ENV === 'production') {
    sequelizeParams.dialect = 'postgres';
    sequelizeParams.dialectOptions = {
      // https://stackoverflow.com/questions/27687546/cant-connect-to-heroku-postgresql-database-from-local-node-app-with-sequelize
      // https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
      // https://stackoverflow.com/questions/58965011/sequelizeconnectionerror-self-signed-certificate
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
    sequelizeParams.host = app.get('connectionString');
  } else {
    sequelizeParams.dialect = 'sqlite';
    sequelizeParams.storage = app.get('connectionString');
  }
  const sequelize = new Sequelize(sequelizeParams);
  app.set('sequelize', sequelize);
  const oldSetup = app.setup;
  // Normally gets called from listen. Tests however don't run listen
  // in general, and must call it themselves.
  app.setup = function (...args) {
    const result = oldSetup.apply(this, args);
    const models = sequelize.models;
    Object.keys(models).forEach(name => {
      if ('associate' in models[name]) {
        models[name].associate(models);
      }
    });
    return sequelize.sync().then(() => result);
  };
}

// Custom middleware should go here below this line.

{
  const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
  const { LocalStrategy } = require('@feathersjs/authentication-local');
  const { expressOauth, OAuthStrategy } = require('@feathersjs/authentication-oauth');

  class GitHubStrategy extends OAuthStrategy {
    async getEntityData(profile) {
      const baseData = await super.getEntityData(profile);
      return {
        ...baseData,
        // You can also set the display name to profile.name
        name: profile.login,
        avatar: profile.avatar_url,
        email: profile.email
      };
    }
  }

  const authentication = new AuthenticationService(app);
  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new LocalStrategy());
  authentication.register('github', new GitHubStrategy());
  app.use('/authentication', authentication);
  app.configure(expressOauth());
}

app.configure(services);
// Channels
{
  if(typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }
  app.on('connection', connection => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection);
  });
  app.on('login', (authResult, { connection }) => {
    if(connection) {
      app.channel('anonymous').leave(connection);
      app.channel('authenticated').join(connection);
    }
  });
  // eslint-disable-next-line no-unused-vars
  app.publish((data, hook) => {
    return app.channel('authenticated');
  });
}

app.use(express.notFound());
app.use(express.errorHandler({ logger }));
app.hooks({
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
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
module.exports = app;
