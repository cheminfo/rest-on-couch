'use strict';

const passport = require('koa-passport');
const router = require('koa-router')({
    prefix: '/auth'
});

router.use(async (ctx, next) => {
    ctx.session.continue = ctx.query.continue || ctx.session.continue;
    await next();
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

router.get('/providers', (ctx) => {
    ctx.body = enabledAuthPlugins.map(plugin => {
        return {
            name: plugin,
            visible: enabledAuthPlugins.includes(plugin)
        };
    });
});

router.get('/login', async (ctx) => {
    if (ctx.isAuthenticated() && !ctx.session.popup) {
        ctx.redirect(ctx.session.continue || '/');
        ctx.session.continue = null;
    } else if (ctx.isAuthenticated() && ctx.session.popup) {
        ctx.session.popup = false;
        ctx.body = '<script>window.close();</script>';
    } else {
        ctx.session.popup = false;
        ctx.state.enabledAuthPlugins = showLoginAuthPlugins;
        ctx.state.pluginConfig = authPluginConfig;
        await ctx.render('login');
    }
});

router.get('/logout', (ctx) => {
    ctx.logout();
    auth.okOrRedirect(ctx);
});

router.get('/session', async (ctx) => {
    // Check if session exists
    const email = await auth.getUserEmail(ctx);
    ctx.body = {
        ok: true,
        username: email,
        authenticated: ctx.isAuthenticated()
    };
});

module.exports = router;
