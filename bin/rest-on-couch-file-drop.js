'use strict';

const app = require('koa')();
const compress = require('koa-compress');
const cors = require('kcors');
const http = require('http');
const passport = require('koa-passport');
const path = require('path');
const serve = require('koa-serve');
const home = require('../lib/config/home');

const config = require('../src/config/config').globalConfig;
const debug = require('../src/util/debug')('server');
const router = require('koa-router')();
const fs = require('fs-extra');

function *getHomeDir(next) {
    let homeDir = home.homeDir;
    if (!homeDir) {
        this.body = 'No homeDir';
        this.status = 500;
        return;
    }
    this.state.homeDir = homeDir;
    yield next;
}

router.post('/upload/:database/:kind/:filename', getHomeDir, function*() {
    console.log(this.state.homeDir);
    const dir = path.join(this.state.homeDir, this.params.database, this.params.kind);
    const file = path.join(dir, this.params.filename);
    fs.mkdirpSync(dir);
    var write = fs.createWriteStream(file);
    this.req.pipe(write);
});


// app.use(function*(next) {
//     this.state.pathPrefix = proxyPrefix;
//     this.state.urlPrefix = this.origin + proxyPrefix;
//     yield next;
// });

app.on('error', printError);

//Unhandled errors
if (config.debugrest) {
    console.log('debugrest');
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

http.createServer(app.callback()).listen(config.fileDropPort, function () {
    debug.warn('running on localhost:' + config.fileDropPort);
});

function printError(err) {
    debug.error('unexpected error: ' + (err.stack || err));
}
