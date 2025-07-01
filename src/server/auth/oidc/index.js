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
        claims: authConfig.claims,
        callbackURL:
          authConfig.callbackURL ||
          `${globalConfig.publicAddress}/auth/login/oidc/callback`,
        scope: ['openid', 'profile', 'email'],
        passReqToCallback: true,
      },
      function verify(
        req,
        issuer,
        // Warning: this won't contain all the profile information, and you might
        // want to parse the id token yourself
        profile,
        context,
        idToken,
        accessToken,
        refreshToken,
        done,
      ) {
        let email;

        if (authConfig.getEmail) {
          try {
            email = authConfig.getEmail({ profile, idToken, accessToken });
          } catch {
            return done(null, false, 'error while parsing user email');
          }
        } else {
          email = profile.username;
        }

        if (typeof email !== 'string' || !isEmail(email)) {
          return done(null, false, 'username must be an email');
        }

        auditLogin(email, true, 'oidc', req.ctx);
        done(null, {
          provider: 'oidc',
          email,
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
