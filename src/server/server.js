'use strict';

const path = require('path');
const proxy = require('./routes/proxy');
const api = require('./routes/api');
const auth = require('./middleware/auth');
const app = require('koa')();
const router = require('koa-router')();
const passport = require('koa-passport');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const render = require('koa-ejs');
const cors = require('kcors');
const http = require('http');
const config = require('../config/config');

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
    maxAge: 100 * ONE_YEAR
}, app));
app.use(passport.initialize());
app.use(passport.session());


app.on('error', handleError);

function handleError(err) {
    console.log('Error', err.stack);
}

module.exports.init = function(config) {
    if(_init) return;
    _init = true;

    if(!config) config = require('./config.default.json');
    else if(typeof config === 'string') config = require(path.resolve(config));

    console.log(JSON.stringify(config));

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
                this.body = err.message + err.stack;
                console.error('Unexpected error', err.message, err.stack);
            }
        });
    }
    app.use(router.routes());
};

module.exports.start = function (config) {
    if (_started) return _started;
    _started = new Promise(function (resolve) {
        http.createServer(app.callback()).listen(3000, function () {
            resolve(app);
        });
    });
    return _started;
};

module.exports.app = app;
