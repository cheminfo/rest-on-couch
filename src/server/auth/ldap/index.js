'use strict';

// Doc: https://github.com/vesse/passport-ldapauth#readme
const LdapStrategy = require('passport-ldapauth');

const { auditLogin } = require('../../../audit/actions');
const auth = require('../../middleware/auth');
const util = require('../../middleware/util');

exports.init = function (passport, router, config) {
  const strategyConfig = { passReqToCallback: true, ...config };
  passport.use(
    new LdapStrategy(strategyConfig, function (req, user, done) {
      const data = {
        provider: 'ldap',
        email: user.mail,
        info: {},
      };
      if (typeof config.getUserEmail === 'function') {
        data.email = config.getUserEmail(user);
      }
      if (typeof data.email !== 'string') {
        return done(
          new Error(`LDAP email must be a string. Saw ${data.email} instead.`),
        );
      }
      if (typeof config.getUserInfo === 'function') {
        return Promise.resolve(config.getUserInfo(user)).then(
          (info) => {
            data.info = info;
            auditLogin(data.email, true, 'ldap', req.ctx);
            done(null, data);
          },
          (err) => done(err),
        );
      } else {
        auditLogin(data.email, true, 'ldap', req.ctx);
        done(null, data);
        return true;
      }
    }),
  );

  router.post(
    '/login/ldap',
    util.parseBody(),
    auth.afterFailure,
    passport.authenticate('ldapauth'),
    auth.afterSuccess,
  );
};
