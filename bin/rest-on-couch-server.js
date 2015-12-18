#!/bin/env node

'use strict';

var path       = require('path'),
    config     = require('./../src/server/config.json'),
    proxy      = require('./../src/server/routes/proxy'),
    auth       = require('./../src/server/middleware/auth'),
    app        = require('koa')(),
    router     = require('koa-router')(),
    passport   = require('koa-passport'),
    co         = require('co'),
    bodyParser = require('koa-bodyparser'),
    session    = require('koa-session'),
    render     = require('koa-ejs'),
    cors       = require('kcors');

render(app, {
    root: path.join(__dirname, '../src/server/views'),
    layout: 'template',
    viewExt: 'ejs',
    cache: false,
    debug: true
});

var ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
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

router.get('/', function *(next) {
    console.log('abc');
    yield next;
});

app.use(router.routes());

app.listen(3000);

app.on('error', handleError);

function handleError(err) {
    console.log('Error', err.stack);
}
