"use strict";
// provided by passport-google-oauth2

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


module.exports = {};

var exp = module.exports;

exp.init = function(passport, router, config) {
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    passport.use(new GoogleStrategy({
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            callbackURL: config.proxy + config.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            done(null, profile);
        }
    ));

    router.get(config.loginURL, function*(next) {
        this.session.redirect = config.successRedirect + '?' + this.request.querystring;
        yield next;
    }, passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));

    router.get(config.callbackURL,
        passport.authenticate('google', {
            failureRedirect: config.failureRedirect
        }), function*() {
            if(this.session.redirect) {
                this.response.redirect(this.session.redirect);
            }
            else {
                this.response.redirect(config.successRedirect);
            }
        });
};