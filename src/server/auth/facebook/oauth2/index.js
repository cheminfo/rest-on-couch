'use strict';
// Facebook profile example
//{
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
//}
var FacebookStrategy = require('passport-facebook');
module.exports = {};

module.exports.init = function (passport, router, config) {
    passport.use(new FacebookStrategy({
            clientID: config.appId,
            clientSecret: config.appSecret,
            callbackURL: config.proxy + config.callbackURL,
            enableProof: false
        },
        function (accessToken, refreshToken, profile, done) {
            done(null, profile);
        }
    ));

    router.get(config.loginURL, function*(next) {
        this.session.redirect = config.successRedirect + '?' + this.request.querystring;
        yield next;
    }, passport.authenticate('facebook', {scope: ['email']}));

    router.get(config.callbackURL,
        passport.authenticate('facebook', {failureRedirect: config.failureRedirect}),
        function*() {
            // Successful authentication, redirect home.
            if(this.session.redirect) {
                this.response.redirect(this.session.redirect);
            }
            else {
                this.response.redirect(config.successRedirect);
            }
        });
};

