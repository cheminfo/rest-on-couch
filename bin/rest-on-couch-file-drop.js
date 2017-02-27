#!/usr/bin/env node

'use strict';

const Koa = require('koa');
const app = new Koa();
const http = require('http');
const path = require('path');
const home = require('../src/config/home');

const config = require('../src/config/config').globalConfig;
const debug = require('../src/util/debug')('server');
const router = require('koa-router')();
const fs = require('fs-extra');

app.proxy = config.fileDropProxy;

async function getHomeDir(ctx, next) {
    let homeDir = home.homeDir;
    if (!homeDir) {
        ctx.body = 'No homeDir';
        ctx.status = 500;
        return;
    }
    ctx.state.homeDir = homeDir;
    await next();
}

router.get('/', (ctx) => {
    ctx.body = 'hello world';
    ctx.status = 200;
});

router.post('/upload/:database/:kind/:filename', getHomeDir, async (ctx) => {
    const dir = path.join(ctx.state.homeDir, ctx.params.database, ctx.params.kind, 'to_process');
    const tmpDir = path.join(ctx.state.homeDir, ctx.params.database, ctx.params.kind, 'tmp');
    fs.mkdirpSync(tmpDir);

    const uploadDir = fs.mkdtempSync(path.join(tmpDir, 'roc-upload-'));
    const uploadPath = path.join(uploadDir, ctx.params.filename);
    const file = path.join(dir, ctx.params.filename);
    const write = fs.createWriteStream(uploadPath);

    try {
        await new Promise((resolve, reject) => {
            write.on('finish', () => {
                try {
                    fs.mkdirpSync(dir);
                } catch (e) {
                    debug.trace('dir already exists');
                }
                fs.renameSync(uploadPath, file);
                fs.rmdirSync(uploadDir);
                resolve();
            });

            write.on('error', () => {
                reject();
                fs.rmdirSync(uploadDir);
            });

            ctx.req.pipe(write);
        });
        ctx.body = 'ok';
        ctx.status = 200;
    } catch (e) {
        ctx.body = 'error';
        ctx.status = 500;
    }
});


// app.use(async (ctx, next) => {
//     ctx.state.pathPrefix = proxyPrefix;
//     ctx.state.urlPrefix = ctx.origin + proxyPrefix;
//     await next();
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
