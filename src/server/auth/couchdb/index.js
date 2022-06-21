'use strict';

const got = require('got');
const LocalStrategy = require('passport-local').Strategy;

const { auditLogin } = require('../../../audit/actions');
const couchUrl = require('../../../config/config').globalConfig.url;
const isEmail = require('../../../util/isEmail');
const auth = require('../../middleware/auth');
const util = require('../../middleware/util');

exports.init = function (passport, router) {
  router.post(
    '/couchdb/user',
    util.parseBody({ jsonLimit: '1kb' }),
    auth.ensureAdmin,
    auth.createUser,
  );

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
      },
      function (req, username, password, done) {
        (async function () {
          if (!isEmail(username)) {
            return done(null, false, 'username must be an email');
          }
          try {
            const res = (
              await got.post(`${couchUrl}/_session`, {
                responseType: 'json',
                json: {
                  name: username,
                  password,
                },
                throwHttpErrors: false,
              })
            ).body;

            if (res.error) {
              auditLogin(username, false, 'couchdb', req.ctx);
              return done(null, false, res.reason);
            }
            auditLogin(username, true, 'couchdb', req.ctx);
            return done(null, {
              email: res.name,
              provider: 'local',
            });
          } catch (err) {
            return done(err);
          }
        })();
      },
    ),
  );

  router.post(
    '/login/couchdb',
    util.parseBody(),
    auth.afterFailure,
    passport.authenticate('local'),
    auth.afterSuccess,
  );
};
