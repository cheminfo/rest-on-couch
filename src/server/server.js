'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const compress = require('koa-compress');
const cors = require('kcors');
const Koa = require('koa');
const koaStatic = require('koa-static');
const passport = require('koa-passport');
const responseTime = require('koa-response-time');
const session = require('koa-session');

const api = require('./routes/api');
const auth = require('./routes/auth');
const config = require('../config/config').globalConfig;
const debug = require('../util/debug')('server');
const nunjucks = require('./nunjucks');

const app = new Koa();

let _started;

app.use(async function (ctx, next) {
    debug.trace(`Method: ${ctx.method}; Path: ${ctx.path}`);
    await next();
});

app.use(compress());
app.use(responseTime());

// trust X-Forwarded- headers
app.proxy = config.proxy;

// support proxyPrefix in this.redirect()
let proxyPrefix = config.proxyPrefix;
debug(`proxy prefix: ${proxyPrefix}`);
if (proxyPrefix !== '') {
    const _redirect = app.context.redirect;
    app.context.redirect = function (url, alt) {
        if (typeof url === 'string' && url.startsWith('/')) {
            url = proxyPrefix + url;
        }
        return _redirect.call(this, url, alt);
    };
}

nunjucks(app, {
    root: path.join(__dirname, '../../views'),
    ext: 'html'
});

app.use(koaStatic(path.resolve(__dirname, '../../public')));

const bundlePath = path.join(__dirname, '../../public/bundle.js');
if (fs.existsSync(bundlePath)) {
// always render index.html unless it's an API route
    let indexHtml = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf8');
    indexHtml = indexHtml.replace(/assets\//g, `${proxyPrefix}/assets/`);
    const bundleJs = fs.readFileSync(bundlePath, 'utf8');
    app.use(async (ctx, next) => {
        if (ctx.path.startsWith('/db') || ctx.path.startsWith('/auth')) {
            await next();
        } else if (ctx.path.endsWith('/bundle.js')) {
            ctx.body = bundleJs;
        } else {
            ctx.body = indexHtml;
        }
    });
}

const allowedOrigins = config.allowedOrigins;
debug(`allowed cors origins: ${allowedOrigins}`);
app.use(cors({
    origin: ctx => {
        const origin = ctx.get('Origin');
        for (var i = 0; i < allowedOrigins.length; i++) {
            if (allowedOrigins[i] === origin) {
                return origin;
            }
        }
        return '*';
    },
    credentials: true
}));

app.keys = config.keys;
app.use(session({
    key: config.sessionKey,
    maxAge: config.sessionMaxAge,
    path: config.sessionPath,
    domain: config.sessionDomain,
    secure: config.sessionSecure,
    httpOnly: true,
    signed: true
}, app));
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

//Unhandled errors
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
app.use(auth.routes());
// ROC API
app.use(api.routes());

module.exports.start = function () {
    if (_started) return _started;
    _started = new Promise(function (resolve) {
        http.createServer(app.callback()).listen(config.port, function () {
            debug.warn(`running on localhost: ${config.port}`);
            resolve(app);
        });
    });
    return _started;
};

module.exports.app = app;

function printError(err) {
    debug.error(`unexpected error: ${err.stack || err}`);
}
