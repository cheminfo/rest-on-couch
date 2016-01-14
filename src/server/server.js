'use strict';

const app = require('koa')();
const bodyParser = require('koa-bodyparser');
const cors = require('kcors');
const http = require('http');
const passport = require('koa-passport');
const path = require('path');
const render = require('koa-ejs');
const router = require('koa-router')();
const session = require('koa-session');

const api = require('./routes/api');
const auth = require('./middleware/auth');
const config = require('../config/config').globalConfig;
const debug = require('../util/debug')('server');
const proxy = require('./routes/proxy');

var _started;
var _init;

render(app, {
    root: path.join(__dirname, '../src/server/views'),
    layout: 'template',
    viewExt: 'ejs',
    cache: false,
    debug: true
});

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
app.use(bodyParser({
    jsonLimit: '100mb'
}));
app.use(cors());

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


app.on('error', printError);

module.exports.init = function() {
    if (_init) return;
    _init = true;

    router.use(auth.init(passport, config).routes());
    router.use(proxy.init(config).routes());
    router.use(api.init(config).routes());

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
    app.use(router.routes());
};

module.exports.start = function () {
    if (_started) return _started;
    _started = new Promise(function (resolve) {
        http.createServer(app.callback()).listen(3000, function () {
            resolve(app);
        });
    });
    return _started;
};

module.exports.app = app;

function printError(err) {
    debug.error('unexpected error: ' + (err.stack || err));
}
