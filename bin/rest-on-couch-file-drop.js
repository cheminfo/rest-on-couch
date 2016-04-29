'use strict';

const app = require('koa')();
const http = require('http');
const path = require('path');
const home = require('../lib/config/home');

const config = require('../src/config/config').globalConfig;
const debug = require('../src/util/debug')('server');
const router = require('koa-router')();
const fs = require('fs-extra');

app.proxy = config.fileDropProxy;

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

router.get('/', function * () {
    this.body = 'hello world';
    this.status = 200;
});

router.post('/upload/:database/:kind/:filename', getHomeDir, function*() {
    const dir = path.join(this.state.homeDir, this.params.database, this.params.kind, 'to_process');
    const uploadDir = fs.mkdtempSync('upload');
    const uploadPath = path.join(uploadDir, this.params.filename);
    const file = path.join(dir, this.params.filename);
    var write = fs.createWriteStream(uploadPath);

    try {
        yield new Promise((resolve, reject) => {
            write.on('finish', () => {
                try {
                    fs.mkdirpSync(dir);
                } catch (e) {
                    debug.trace('dir already exists');
                }
                fs.renameSync(uploadPath, file);
                resolve();
            });

            write.on('error', () => {
                reject();
            });

            this.req.pipe(write);
        });
        this.body = 'ok';
        this.status = 200;
    } catch (e) {
        this.body = 'error';
        this.status = 500;
    }
});


// app.use(function*(next) {
//     this.state.pathPrefix = proxyPrefix;
//     this.state.urlPrefix = this.origin + proxyPrefix;
//     yield next;
// });

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

http.createServer(app.callback()).listen(config.fileDropPort, function () {
    debug.warn('running on localhost:' + config.fileDropPort);
});

function printError(err) {
    debug.error('unexpected error: ' + (err.stack || err));
}
