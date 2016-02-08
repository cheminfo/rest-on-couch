'use strict';

// Doc: https://github.com/vesse/passport-ldapauth#readme
const LdapStrategy = require('passport-ldapauth');

const auth = require('../../middleware/auth');
const util = require('../../middleware/util');

exports.init = function (passport, router, config) {
    passport.use(new LdapStrategy(
        {
            server: config.server,
            usernameField: config.usernameField,
            passwordField: config.passwordField
        },
        function (user, done) {
            done(null, {
                provider: 'ldap',
                email: user.mail
            });
        }
    ));

    router.post('/login/ldap', util.parseBody(), passport.authenticate('ldapauth'), function *() {
        this.body = {
            ok: true,
            name: yield auth.getUserEmail(this)
        };
    });
};
