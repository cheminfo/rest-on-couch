'use strict';

const path = require('path');
const config = require('./default.config.json');
const proxy = require('./routes/proxy');
const auth = require('./middleware/auth');
const app = require('koa')();
const router = require('koa-router')();
const passport = require('koa-passport');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const render = require('koa-ejs');
const cors = require('kcors');
const http = require('http');

var _started;

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
app.keys = ['some secret'];
app.use(session({
    maxAge: 100 * ONE_YEAR
}, app));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());


//proxy.init(router, config);
//auth.init(passport, router, config);

auth.init(passport, router, config);
proxy.init(router, config);


//Unhandled errors
app.use(function *(next) {
    try {
        yield next;
    } catch (err) {
        this.status = err.status || 500;
        this.body = err.message;
        console.error('Unexpected error', err.message, err.stack);
    }
});

app.use(router.routes());

app.on('error', handleError);

function handleError(err) {
    console.log('Error', err.stack);
}

module.exports.start = function () {
    if (_started) return _started;
    _started = new Promise(function(resolve) {
        http.createServer(app.callback()).listen(3000, function () {
            resolve(app);
        });
    });
    return _started;
};

module.exports.app = app;
