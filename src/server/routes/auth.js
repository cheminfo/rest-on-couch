'use strict';

const Router = require('@koa/router');
const passport = require('koa-passport');

const router = new Router({
  prefix: '/auth',
});

router.use(async (ctx, next) => {
  ctx.session.continue = ctx.query.continue || ctx.session.continue;
  await next();
});

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');
const die = require('../../util/die');
const auth = require('../middleware/auth');
const util = require('../middleware/util');

const authPlugins = ['couchdb', 'google', 'facebook', 'github', 'ldap', 'oidc'];

const enabledAuthPlugins = [];
const showLoginAuthPlugins = [];

const defaultAuthPluginConfig = {
  ldap: {
    title: 'LDAP',
  },
  couchdb: {
    title: 'CouchDB',
  },
  google: {
    title: 'Google',
  },
  facebook: {
    title: 'Facebook',
  },
  github: {
    title: 'GitHub',
  },
};
const authPluginConfig = {};

if (config.auth) {
  authPlugins.forEach((authPlugin) => {
    const pluginConfig = config.auth[authPlugin];
    if (!pluginConfig) {
      debug('plugin %s not configured', authPlugin);
      return;
    }
    authPluginConfig[authPlugin] = {
      ...defaultAuthPluginConfig[authPlugin],
      ...pluginConfig,
    };
    try {
      debug('loading auth plugin: %s', authPlugin);
      require(`../auth/${authPlugin}/index.js`).init(
        passport,
        router,
        config.auth[authPlugin],
        config,
      );
      enabledAuthPlugins.push(authPlugin);
      if (pluginConfig.showLogin !== false) {
        showLoginAuthPlugins.push(authPlugin);
      }
      debug('auth plugin successfully loaded');
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
  ctx.body = enabledAuthPlugins.map((plugin) => {
    const pluginConfig = authPluginConfig[plugin];
    return {
      name: plugin,
      title: pluginConfig.title || plugin,
      visible: enabledAuthPlugins.includes(plugin),
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
    const hbsCtx = {
      pathPrefix: ctx.state.pathPrefix,
      pluginConfig: authPluginConfig,
    };
    for (const authPlugin of showLoginAuthPlugins) {
      hbsCtx[authPlugin] = true;
    }
    await ctx.render('login', hbsCtx);
  }
});

router.get('/logout', (ctx) => {
  ctx.logout();
  auth.okOrRedirect(ctx);
});

router.get('/session', async (ctx) => {
  // Check if session exists
  ctx.body = {
    ok: true,
    username: await auth.getUserEmail(ctx),
    admin: auth.isAdmin(ctx),
    provider: auth.getProvider(ctx),
    authenticated: ctx.isAuthenticated(),
  };
});

router.post(
  '/password',
  util.parseBody({ jsonLimit: '1kb' }),
  auth.changePassword,
);

module.exports = router;
