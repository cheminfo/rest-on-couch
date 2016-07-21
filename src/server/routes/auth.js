'use strict';

const passport = require('koa-passport');
const router = require('koa-router')({
    prefix: '/auth'
});

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');
const die = require('../../util/die');
const getUserEmail = require('../middleware/auth').getUserEmail;

const authPlugins = [
    'couchdb',
    'google',
    'facebook',
    'github',
    'ldap'
];

const enabledAuthPlugins = [];

if (config.auth) {
    authPlugins.forEach(function (authPlugin) {
        if (!config.auth[authPlugin]) {
            return debug(`plugin ${authPlugin} not configured`);
        }
        try {
            debug(`loading auth plugin: ${authPlugin}`);
            require(`../auth/${authPlugin}/index.js`).init(passport, router, config.auth[authPlugin], config);
            enabledAuthPlugins.push(authPlugin);
        } catch (e) {
            debug.error(e);
            die(`could not init auth middleware: ${e.message}`);
        }
    });
    if (enabledAuthPlugins.length === 0) {
        debug.error('no authentication plugin was loaded');
    }
}

router.get('/login', function*() {
    this.session.continue = this.query.continue || this.session.continue;
    if (this.isAuthenticated() && !this.session.popup) {
        this.redirect(this.session.continue || '/');
        this.session.continue = null;
    } else {
        this.session.popup = false;
        this.state.enabledAuthPlugins = enabledAuthPlugins;
        yield this.render('login');
    }
});

router.get('/logout', function*() {
    this.logout();
    this.redirect('/auth/login');
});

router.get('/session', function*() {
    var that = this;
    // Check if session exists
    var email = yield getUserEmail(that);
    this.body = {
        ok: true,
        username: email,
        authenticated: this.isAuthenticated()
    };
});

module.exports = router;
