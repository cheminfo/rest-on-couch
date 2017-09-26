'use strict';

const OrcidStrategy = require('passport-orcid').Strategy;

exports.init = function (passport, router, config, mainConfig) {
    passport.use(new OrcidStrategy({
            sandbox: process.env.NODE_ENV !== 'production', // use the sandbox for non-production environments
            clientID: config.clientId,
            clientSecret: config.clientSecret,
            callbackURL: `${mainConfig.publicAddress}/auth/login/orcid/callback`
        },
        function (accessToken, refreshToken, params, profile, done) {
            console.log(params, profile);
            // NOTE: `profile` is empty, use `params` instead
            const email = params.email || profile.email;
            if (!email) {
                return done(null, false, {message: 'No orcid account email'});
            } else {
                done(null, {
                    provider: 'orcid',
                    email
                });
                return true;
            }
        }
    ));

    app.get('/login/orcid',
        passport.authenticate('orcid'));

    app.get('/login/orcid/callback',
        passport.authenticate('orcid', { failureRedirect: '/auth/login' }),
        function(ctx) {
            // Successful authentication, redirect home.
            ctx.redirect('/auth/login');
        });
};
