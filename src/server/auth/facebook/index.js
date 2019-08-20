'use strict';

// Facebook profile example
// {
//    id: '739343132829716',
//        username: undefined,
//    displayName: 'Daniel Kostro',
//    name:
//    {
//        familyName: 'Kostro',
//            givenName: 'Daniel',
//        middleName: undefined
//    },
//    gender: 'male',
//        profileUrl: 'https://www.facebook.com/app_scoped_user_id/739343132829716/',
//    emails: [ { value: 'kostro.d@gmail.com' } ],
//    provider: 'facebook',
//    _raw: '{"id":"739343132829716","email":"kostro.d\\u0040gmail.com","first_name":"Daniel","gender":"male","last_name":"Kostro","link":"https:\\/\\/www.facebook.com\\/app_scoped_user_id\\/739343132829716\\/","locale":"en_US","name":"Daniel Kostro","timezone":1,"updated_time":"2014-03-16T09:40:42+0000","verified":true}',
//    _json:
//    {
//        id: '739343132829716',
//            email: 'kostro.d@gmail.com',
//        first_name: 'Daniel',
//        gender: 'male',
//        last_name: 'Kostro',
//        link: 'https://www.facebook.com/app_scoped_user_id/739343132829716/',
//        locale: 'en_US',
//        name: 'Daniel Kostro',
//        timezone: 1,
//        updated_time: '2014-03-16T09:40:42+0000',
//        verified: true
//    }
// }
const FacebookStrategy = require('passport-facebook');

const { auditLogin } = require('../../../audit/actions');

exports.init = function(passport, router, config) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.appId,
        clientSecret: config.appSecret,
        callbackURL: config.publicAddress + config.callbackURL,
        enableProof: false,
        passReqToCallback: true,
      },
      function(req, accessToken, refreshToken, profile, done) {
        const email = profile._json.email;
        auditLogin(email, true, 'facebook', req.ctx);
        done(null, {
          provider: 'facebook',
          email,
        });
      },
    ),
  );

  router.get(
    config.loginURL,
    async (ctx, next) => {
      ctx.session.redirect = `${config.successRedirect}?${ctx.request.querystring}`;
      await next();
    },
    passport.authenticate('facebook', { scope: ['email'] }),
  );

  router.get(
    config.callbackURL,
    passport.authenticate('facebook', {
      failureRedirect: config.failureRedirect,
    }),
    (ctx) => {
      // Successful authentication, redirect home.
      if (ctx.session.redirect) {
        ctx.response.redirect(ctx.session.redirect);
      } else {
        ctx.response.redirect(config.successRedirect);
      }
    },
  );
};
