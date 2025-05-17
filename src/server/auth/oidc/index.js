'use strict';

const OIDCStrategy = require('passport-openidconnect');

const { auditLogin } = require('../../../audit/actions');
const isEmail = require('../../../util/isEmail');

exports.init = function initOidc(passport, router, authConfig, globalConfig) {
  passport.use(
    new OIDCStrategy(
      {
        issuer: authConfig.issuer,
        authorizationURL: authConfig.authorizationURL,
        tokenURL: authConfig.tokenURL,
        userInfoURL: authConfig.userInfoURL,
        clientID: authConfig.clientID,
        clientSecret: authConfig.clientSecret,
        callbackURL:
          authConfig.callbackURL ||
          `${globalConfig.publicAddress}/auth/login/oidc/callback`,
        scope: ['openid', 'profile', 'email'],
        passReqToCallback: true,
      },
      function verify(req, issuer, profile, done) {
        if (!profile.username || !isEmail(profile.username)) {
          return done(null, false, 'username must be an email');
        }
        auditLogin(profile.username, true, 'oidc', req.ctx);
        done(null, {
          provider: 'oidc',
          email: profile.username,
        });
      },
    ),
  );

  router.get('/login/oidc', passport.authenticate('openidconnect'));

  router.get(
    '/login/oidc/callback',
    passport.authenticate('openidconnect', {
      failureRedirect: globalConfig.authRedirectUrl,
      // TODO: activate this and show messages in the UI
      failureMessage: false,
    }),
    (ctx) => {
      ctx.response.redirect(globalConfig.authRedirectUrl);
    },
  );
};
