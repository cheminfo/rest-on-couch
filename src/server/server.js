'use strict';

const http = require('http');
const path = require('path');

const koaViews = require('@ladjs/koa-views');
const cors = require('kcors');
const Koa = require('koa');
const passport = require('koa-passport');
const responseTime = require('koa-response-time');
const { createSession } = require('koa-session');
const koaStatic = require('koa-static');

const { getGlobalConfig } = require('../config/config');
const initCouch = require('../initCouch');
const debug = require('../util/debug')('server');

const api = require('./routes/api');
const getAuthRouter = require('./routes/auth');

function createApp() {
  const config = getGlobalConfig();

  const app = new Koa();

  app.use(async (ctx, next) => {
    debug.trace('Method: %s; Path: %s', ctx.method, ctx.path);
    await next();
  });

  app.use(responseTime());

  // trust X-Forwarded- headers
  app.proxy = config.proxy;

  // support proxyPrefix in this.redirect()
  let proxyPrefix = config.proxyPrefix;
  debug('proxy prefix: %s', proxyPrefix);
  if (proxyPrefix !== '') {
    const _redirect = app.context.redirect;
    app.context.redirect = function redirect(url, alt) {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = proxyPrefix + url;
      }
      return _redirect.call(this, url, alt);
    };
  }

  app.use(
    koaViews(path.join(__dirname, '../../views'), {
      map: {
        hbs: 'handlebars',
      },
    }),
  );

  app.use(koaStatic(path.resolve(__dirname, '../../dist')));

  const allowedOrigins = config.allowedOrigins;
  debug('allowed cors origins: %o', allowedOrigins);
  app.use(
    cors({
      origin: (ctx) => {
        const origin = ctx.get('Origin');
        for (var i = 0; i < allowedOrigins.length; i++) {
          if (allowedOrigins[i] === origin) {
            return origin;
          }
        }
        return '*';
      },
      credentials: true,
    }),
  );

  const sessionMaxAge = Number.isNaN(Number(config.sessionMaxAge))
    ? config.sessionMaxAge
    : Number(config.sessionMaxAge);
  app.keys = config.keys;
  app.use(
    createSession(
      {
        key: config.sessionKey,
        maxAge: sessionMaxAge,
        path: config.sessionPath,
        domain: config.sessionDomain,
        secure: config.sessionSecure,
        httpOnly: true,
        signed: config.sessionSigned,
        sameSite: config.sessionSameSite,
      },
      app,
    ),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(async (ctx, next) => {
    await next();
    // Force a session change to renew the cookie
    ctx.session.time = Date.now();
  });

  app.use(async (ctx, next) => {
    ctx.state.pathPrefix = proxyPrefix;
    ctx.state.urlPrefix = ctx.origin + proxyPrefix;
    await next();
  });

  app.on('error', printError);

  // Unhandled errors
  if (config.debugrest) {
    // In debug mode, show unhandled errors to the user
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = `${err.message}\n${err.stack}`;
        printError(err);
      }
    });
  }

  // Authentication
  app.use(getAuthRouter().routes());
  // ROC API
  app.use(api.routes());

  return app;
}

function printError(err) {
  debug.error('unexpected error', err.stack || err);
}

let _started;

function start() {
  if (_started) return _started;
  _started = new Promise((resolve, reject) => {
    const config = getGlobalConfig();
    const app = getApp();
    initCouch().then(
      () => {
        const server = http
          .createServer(app.callback())
          .listen(config.port, () => {
            debug.warn('running on localhost: %d', config.port);
            resolve(app);
          });
        process.on('SIGTERM', () => {
          debug('Received SIGTERM signal');
          server.close(() => {
            debug('server closed');
          });
        });
      },
      (e) => {
        reject(e);
        process.nextTick(() => {
          debug.error('initialization failed');
          throw e;
        });
      },
    );
  });
  return _started;
}

let _app;

function getApp() {
  _app ??= createApp();
  return _app;
}

module.exports = {
  start,
  getApp,
};
