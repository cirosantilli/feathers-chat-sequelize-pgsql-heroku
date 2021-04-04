const compress = require('compression');
const cors = require('cors');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const path = require('path');

const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');

const appHooks = require('./app.hooks');
const authentication = require('./authentication');
const channels = require('./channels');
const logger = require('./logger');
const middleware = require('./middleware');
const sequelize = require('./sequelize');
const services = require('./services');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.configure(sequelize);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
