'use strict';

// Doc: https://github.com/vesse/passport-ldapauth#readme
const LdapStrategy = require('passport-ldapauth');

const util = require('../../middleware/util');

exports.init = function (passport, router, config) {
    passport.use(new LdapStrategy(
        config,
        function (user, done) {
            const data = {
                provider: 'ldap',
                email: user.mail,
                info: {}
            };
            if (typeof config.getUserInfo === 'function') {
                return Promise.resolve(config.getUserInfo(user)).then(info => {
                    data.info = info;
                    done(null, data);
                }, err => done(err));
            } else {
                done(null, data);
            }
        }
    ));

    router.post('/login/ldap', util.parseBody(), passport.authenticate('ldapauth', {
        successRedirect: '/auth/login',
        failureRedirect: '/auth/login'
    }));
};
