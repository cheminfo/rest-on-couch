'use strict';

const passport = require('koa-passport');
const router = require('koa-router')({
    prefix: '/auth'
});

router.use(function*(next) {
    this.session.continue = this.query.continue || this.session.continue;
    yield next;
});

const auth = require('../middleware/auth');
const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');
const die = require('../../util/die');

const authPlugins = [
    'couchdb',
    'google',
    'facebook',
    'github',
    'ldap'
];

const enabledAuthPlugins = [];
const showLoginAuthPlugins = [];

const defaultAuthPluginConfig = {
    ldap: {
        title: 'LDAP login'
    },
    couchdb: {
        title: 'CouchDB login'
    }
};
const authPluginConfig = {};

if (config.auth) {
    authPlugins.forEach((authPlugin) => {
        const pluginConfig = config.auth[authPlugin];
        if (!pluginConfig) {
            debug(`plugin ${authPlugin} not configured`);
            return;
        }
        authPluginConfig[authPlugin] = Object.assign({}, defaultAuthPluginConfig[authPlugin], pluginConfig);
        try {
            debug(`loading auth plugin: ${authPlugin}`);
            require(`../auth/${authPlugin}/index.js`).init(passport, router, config.auth[authPlugin], config);
            enabledAuthPlugins.push(authPlugin);
            if (pluginConfig.showLogin !== false) {
                showLoginAuthPlugins.push(authPlugin);
            }
        } catch (e) {
            debug.error(e);
            die(`could not init auth middleware: ${e.message}`);
        }
    });
    if (enabledAuthPlugins.length === 0) {
        debug.error('no authentication plugin was loaded');
    }
}

router.get('/providers', function*() {
    this.body = enabledAuthPlugins.map(plugin => {
        return {
            name: plugin,
            visible: enabledAuthPlugins.includes(plugin)
        };
    });
});

router.get('/login', function*() {
    if (this.isAuthenticated() && !this.session.popup) {
        this.redirect(this.session.continue || '/');
        this.session.continue = null;
    } else if (this.isAuthenticated() && this.session.popup) {
        this.session.popup = false;
        this.body = '<script>window.close();</script>';
    } else {
        this.session.popup = false;
        this.state.enabledAuthPlugins = showLoginAuthPlugins;
        this.state.pluginConfig = authPluginConfig;
        yield this.render('login');
    }
});

router.get('/logout', function*() {
    this.logout();
    auth.okOrRedirect(this);
});

router.get('/session', function*() {
    // Check if session exists
    const email = yield auth.getUserEmail(this);
    this.body = {
        ok: true,
        username: email,
        authenticated: this.isAuthenticated()
    };
});

module.exports = router;
