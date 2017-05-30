#!/usr/bin/env node

'use strict';

const Koa = require('koa');
const app = new Koa();
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const router = require('koa-router')();

const config = require('../src/config/config').globalConfig;
const debug = require('../src/util/debug')('server');
const tryMove = require('../src/util/tryMove');

app.proxy = config.fileDropProxy;

async function getHomeDir(ctx, next) {
    let homeDir = config.homeDir;
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
    await fs.mkdirp(tmpDir);
    const uploadDir = await fs.mkdtemp(path.join(tmpDir, 'roc-upload-'));
    const uploadPath = path.join(uploadDir, ctx.params.filename);
    const file = path.join(dir, ctx.params.filename);
    const write = fs.createWriteStream(uploadPath);
    try {
        await new Promise((resolve, reject) => {
            write.on('finish', async () => {
                try {
                    await tryMove(uploadPath, file);
                    await fs.rmdir(uploadDir);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            write.on('error', async (e) => {
                try {
                    await fs.rmdir(uploadDir);
                } finally {
                    reject(e);
                }
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
