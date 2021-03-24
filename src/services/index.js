const users = require('./users');
const messages = require('./messages/messages.service.js');
const db = require('./db/db.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(messages);
  app.configure(db);
};
