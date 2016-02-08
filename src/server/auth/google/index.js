'use strict';
// provided by passport-google-oauth20

//{
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
//}
//}

const GoogleStrategy = require('passport-google-oauth20').Strategy;

exports.init = function (passport, router, config, mainConfig) {
    // todo we should be able to put a relative callbackURL (add proxy: true) but there is a bug in passport-oauth2
    // with the generation of redirect_url. see https://github.com/jaredhanson/passport-oauth2/blob/master/lib/strategy.js#L136
    passport.use(new GoogleStrategy({
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            callbackURL: mainConfig.publicAddress + '/auth/login/google/callback'
        },
        function (accessToken, refreshToken, profile, done) {
            const email = profile.emails.find(email => email.type === 'account');
            if (!email) {
                return done(null, false, {message: 'No account email'});
            } else {
                done(null, {
                    provider: 'google',
                    email
                });
            }
        }
    ));

    router.get('/login/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.email']}));

    router.get('/login/google/callback',
        passport.authenticate('google', {
            successRedirect: '/auth/login',
            failureRedirect: '/auth/login'
        })
    );
};
