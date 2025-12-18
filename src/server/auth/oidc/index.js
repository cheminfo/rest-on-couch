'use strict';

const debug = require('../../../util/debug.js')('auth:oidc');
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
        skipUserProfile: authConfig.skipUserProfile,
        callbackURL:
          authConfig.callbackURL ||
          `${globalConfig.publicAddress}/auth/login/oidc/callback`,
        scope: ['openid', 'profile', 'email'],
        passReqToCallback: true,
      },
      function verify(
        req,
        issuer,
        // Warning: this won't always contain all the profile information,
        // and you might want to parse the id token yourself
        profile,
        context,
        idToken,
        accessToken,
        refreshToken,
        done,
      ) {
        let email;
        let sessionProfile;

        const { getEmail = () => profile.email, getProfile = () => profile } =
          authConfig;
        try {
          email = getEmail({ profile, idToken, accessToken });
        } catch (err) {
          debug.error('error while parsing user email', err);
          return done(null, false, 'error while parsing user email');
        }

        if (typeof email !== 'string' || !isEmail(email)) {
          return done(null, false, 'username must be an email');
        }

        try {
          sessionProfile = getProfile({ profile, idToken, accessToken });
        } catch (err) {
          debug.error('error while parsing user profile', err);
          return done(null, false, 'error while parsing user profile');
        }

        auditLogin(email, true, 'oidc', req.ctx);
        done(null, {
          provider: 'oidc',
          email,
          profile: authConfig.storeProfileInSession
            ? sessionProfile
            : undefined,
        });
      },
    ),
  );

  router.get('/login/oidc', passport.authenticate('openidconnect'));

  router.get(
    '/login/oidc/callback',
    passport.authenticate('openidconnect', {
      failureRedirect: globalConfig.authRedirectUrl,
      failureMessage: true,
    }),
    (ctx) => {
      ctx.response.redirect(globalConfig.authRedirectUrl);
    },
  );
};
