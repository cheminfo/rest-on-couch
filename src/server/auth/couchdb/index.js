'use strict';

const co = require('co');
const LocalStrategy = require('passport-local').Strategy;
const request = require('co-request');

const couchUrl = require('../../../config/config').globalConfig.url;
const isEmail = require('../../../util/isEmail');
const util = require('../../middleware/util');

exports.init = function (passport, router) {
    passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function (username, password, done) {
            co(function*() {
                if (!isEmail(username)) {
                    return done(null, false, 'username must be an email');
                }
                var res = yield request.post(couchUrl + '/' + '_session', {
                    form: {
                        name: username,
                        password: password
                    }
                });
                if (res[0] instanceof Error) {
                    return done(res[0]);
                }
                res = JSON.parse(res.body);

                if (res.error) {
                    return done(null, false, res.reason);
                }
                done(null, {
                    email: res.name,
                    provider: 'local'
                });
            });
        }));

    router.post('/login/couchdb', util.parseBody(), passport.authenticate('local', {
        successRedirect: '/auth/login',
        failureRedirect: '/auth/login'
    }));
};
