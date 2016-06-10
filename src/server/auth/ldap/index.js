'use strict';

// Doc: https://github.com/vesse/passport-ldapauth#readme
const LdapStrategy = require('passport-ldapauth');

const util = require('../../middleware/util');

exports.init = function (passport, router, config) {
    passport.use(new LdapStrategy(
        config,
        function (user, done) {
            done(null, {
                provider: 'ldap',
                email: user.mail,
                uid: user.uid ? user.uid[0] : null
            });
        }
    ));

    router.post('/login/ldap', util.parseBody(), passport.authenticate('ldapauth', {
        successRedirect: '/auth/login',
        failureRedirect: '/auth/login'
    }));
};
