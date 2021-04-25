# feathers-chat sequelize PostgreSQL + Heroku

This is a fork of the Feathers.js hello world app https://github.com/feathersjs/feathers-chat but working on:

- PostgreSQL via sequelize instead of the default disk-based NeDB. Local tests run on SQLite instead so you don't have to worry about configuring database connections.
- heroku

This achieves a similar goal to:

- https://github.com/pedrogk/feathers-chat-sequelize
- https://github.com/catalyst-technologies/feathers-chat-pgsql

but both of those were failing on my Ubuntu 20.10 Node 14.16.0 presumably because of my incompatible Node/PostgreSQL versions, and I couldn't easily find in which versions the authors had tested to reproduce without further debugging.

So in the end I just took inspiration from their code, and re-ported the official feathers-chat instead, since that was working out-of-the box on my system.

The original motivation for this is to be able to run in Heroku, which provides a PostgreSQL database, but no persistent filesystem storage: https://stackoverflow.com/questions/42775418/heroku-local-persistent-storage

## Local test

When running locally outside of `NODE_ENV=production`, SQLite is used, so you don't have to worry about configuring database connections, just run the usual:

```
npm install
npm start
```

## Heroku deployment

- enable the PostgreSQL Heroku add-on with:

  ```
  heroku addons:create heroku-postgresql:hobby-dev
  ```

  This automatically sets the `DATABASE_URL` environment variable for us.
- in [config/production.json](config/production.json) edit `host` to your correct value

After running those steps, we managed to get the app running successfully at <https://cirosantilli-feathersjs-chat.herokuapp.com/> on March 2021!!!

Further overview at: https://stackoverflow.com/questions/47270219/deploy-feathersjs-app-on-heroku/66723974#66723974

TODO:

- get GitHub authentication working. We tried, and it goes into the GitHub permission page, but then you get redirected to the home page not logged in.
- require email confirmation for account creation
