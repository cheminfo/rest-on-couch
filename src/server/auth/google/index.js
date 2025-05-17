'use strict';
// provided by passport-google-oauth20

// {
//    "user": {
//        "provider": "google",
//            "id": "100982963740157602406",
//            "displayName": "Daniel Kostro",
//            "name": {
//            "familyName": "Kostro",
//            "givenName": "Daniel"
//        },
//        "emails": [
//            {
//                "value": "kostro.d@gmail.com"
//            }
//        ],
//        "_raw": "{\n \"id\": \"100982963740157602406\",\n \"email\": \"kostro.d@gmail.com\",\n \"verified_email\": true,\n \"name\": \"Daniel Kostro\",\n \"given_name\": \"Daniel\",\n \"family_name\": \"Kostro\",\n \"link\": \"https://plus.google.com/+DanielKostro\",\n \"picture\": \"https://lh3.googleusercontent.com/-IvcZEni7cxM/AAAAAAAAAAI/AAAAAAAACso/4Zy9vw_ucks/photo.jpg\",\n \"gender\": \"male\"\n}\n",
//        "_json": {
//        "id": "100982963740157602406",
//        "email": "kostro.d@gmail.com",
//        "verified_email": true,
//        "name": "Daniel Kostro",
//        "given_name": "Daniel",
//        "family_name": "Kostro",
//        "link": "https://plus.google.com/+DanielKostro",
//        "picture": "https://lh3.googleusercontent.com/-IvcZEni7cxM/AAAAAAAAAAI/AAAAAAAACso/4Zy9vw_ucks/photo.jpg",
//        "gender": "male"
//    }
// }
// }

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { auditLogin } = require('../../../audit/actions');

exports.init = function init(passport, router, authConfig, globalConfig) {
  // todo we should be able to put a relative callbackURL (add proxy: true) but there is a bug in passport-oauth2
  // with the generation of redirect_url
  passport.use(
    new GoogleStrategy(
      {
        clientID: authConfig.clientID,
        clientSecret: authConfig.clientSecret,
        callbackURL: `${globalConfig.publicAddress}/auth/login/google/callback`,
        passReqToCallback: true,
      },
      (req, accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0];
        if (!email) {
          return done(null, false, { message: 'No profile email' });
        } else {
          auditLogin(email.value, true, 'google', req.ctx);
          done(null, {
            provider: 'google',
            email: email.value,
          });
          return true;
        }
      },
    ),
  );

  router.get('/login/google/popup', (ctx) => {
    ctx.session.popup = true;
    ctx.redirect('/auth/login/google');
  });

  router.get(
    '/login/google',
    passport.authenticate('google', {
      scope: ['https://www.googleapis.com/auth/userinfo.email'],
    }),
  );

  router.get(
    '/login/google/callback',
    passport.authenticate('google', {
      successRedirect: globalConfig.authRedirectUrl,
      failureRedirect: globalConfig.authRedirectUrl,
    }),
  );
};
