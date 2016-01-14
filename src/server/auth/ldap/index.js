'use strict';

// Doc: https://github.com/vesse/passport-ldapauth#readme

const auth = require('../../middleware/auth');

exports.init = function(passport, router, config) {
    var LdapStrategy = require('passport-ldapauth');

    passport.use(new LdapStrategy(
        {
            server: config.server,
            usernameField: config.usernameField,
            passwordField: config.passwordField
        },
        function(user, done) {
            done(null, {
                provider: 'ldap',
                email: user.mail
            });
        }
    ));

    router.post('/login/ldap', passport.authenticate('ldapauth'), function *() {
        this.body = {
            ok: true,
            name: yield auth.getUserEmail(this)
        };
    });

};
