'use strict';

const LocalStrategy = require('passport-local').Strategy;

const request = require('../../../util/requestPromise');
const couchUrl = require('../../../config/config').globalConfig.url;
const isEmail = require('../../../util/isEmail');
const util = require('../../middleware/util');
const auth = require('../../middleware/auth');

exports.init = function (passport, router) {
  router.post(
    '/couchdb/user',
    util.parseBody({ jsonLimit: '1kb' }),
    auth.ensureAdmin,
    auth.createUser
  );

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password'
      },
      function (username, password, done) {
        (async function () {
          if (!isEmail(username)) {
            return done(null, false, 'username must be an email');
          }
          try {
            let res = await request.post(`${couchUrl}/_session`, {
              form: {
                name: username,
                password: password
              },
              resolveWithFullResponse: true
            });

            res = JSON.parse(res.body);
            if (res.error) {
              return done(null, false, res.reason);
            }
            return done(null, {
              email: res.name,
              provider: 'local'
            });
          } catch (err) {
            return done(err);
          }
        })();
      }
    )
  );

  router.post(
    '/login/couchdb',
    util.parseBody(),
    auth.afterFailure,
    passport.authenticate('local'),
    auth.afterSuccess
  );
};
