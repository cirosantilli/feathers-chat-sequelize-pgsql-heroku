/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

if (process.env.NODE_ENV === 'production') {
  logger.info('envirnoment:');
  for (const key of Object.keys(process.env).sort()) {
    logger.info(`${key} ${process.env[key]}`);
  }
  logger.info();
  logger.info('authentication.oauth.github.secret ' + app.get('authentication').oauth.github.secret);
}

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);
