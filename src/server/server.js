'use strict';

const app = require('koa')();
const cors = require('kcors');
const http = require('http');
const passport = require('koa-passport');
const path = require('path');
const responseTime = require('koa-response-time');
const serve = require('koa-serve');
const session = require('koa-session');

const api = require('./routes/api');
const auth = require('./routes/auth');
const config = require('../config/config').globalConfig;
const debug = require('../util/debug')('server');
const nunjucks = require('./nunjucks');
const proxy = require('./routes/proxy');
const router = require('./routes/main');

let _started;

app.use(responseTime());

// trust X-Forwarded- headers
app.proxy = config.proxy;

// support proxyPrefix in this.redirect()
let proxyPrefix = config.proxyPrefix;
if (!proxyPrefix.startsWith('/')) {
    proxyPrefix = '/' + proxyPrefix;
}
if (!proxyPrefix.endsWith('/')) {
    proxyPrefix = proxyPrefix + '/';
}

debug(`proxy prefix: ${proxyPrefix}`);
if (proxyPrefix !== '/') {
    const _redirect = app.context.redirect;
    app.context.redirect = function (url, alt) {
        if (typeof url === 'string' && url.startsWith('/')) {
            url = proxyPrefix + url.substring(1);
        }
        return _redirect.call(this, url, alt);
    };
}

nunjucks(app, {
    root: path.join(__dirname, '../../views'),
    ext: 'html'
});

app.use(serve('assets', path.join(__dirname, '../..')));

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

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

app.keys = ['some secret'];
app.use(session({
    maxAge: ONE_YEAR,
    path: '/',
    domain: config.sessionDomain,
    secure: config.sessionSecure,
    secureProxy: config.sessionSecureProxy, // true if SSL is handled by Apache
    httpOnly: true,
    signed: true

}, app));
app.use(passport.initialize());
app.use(passport.session());

app.use(function*(next) {
    this.state.pathPrefix = proxyPrefix;
    this.state.urlPrefix = this.origin + proxyPrefix;
    yield next;
});

app.on('error', printError);

//Unhandled errors
if (config.debugrest) {
    // In debug mode, show unhandled errors to the user
    app.use(function *(next) {
        try {
            yield next;
        } catch (err) {
            this.status = err.status || 500;
            this.body = err.message + '\n' + err.stack;
            printError(err);
        }
    });
}

// Main routes
app.use(router.routes());
// Authentication
app.use(auth.routes());
// Proxy to CouchDB
app.use(proxy.init(config).routes());
// ROC API
app.use(api.init(config).routes());

module.exports.start = function () {
    if (_started) return _started;
    _started = new Promise(function (resolve) {
        http.createServer(app.callback()).listen(config.port, function () {
            debug.warn('running on localhost:' + config.port);
            resolve(app);
        });
    });
    return _started;
};

module.exports.app = app;

function printError(err) {
    debug.error('unexpected error: ' + (err.stack || err));
}
