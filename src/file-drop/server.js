#!/usr/bin/env node

'use strict';

const http = require('http');
const path = require('path');

const { Router } = require('@koa/router');
const fs = require('fs-extra');
const Koa = require('koa');

const { getGlobalConfig } = require('../config/config');
const debug = require('../util/debug')('server');
const tryMove = require('../util/tryMove');

const router = new Router();

async function getHomeDir(ctx, next) {
  let homeDir = getGlobalConfig().homeDir;
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

async function writeUpload(ctx, database, kind, filename) {
  const dir = path.join(ctx.state.homeDir, database, kind, 'to_process');
  const tmpDir = path.join(ctx.state.homeDir, database, kind, 'tmp');
  await fs.mkdirp(tmpDir);
  const uploadDir = await fs.mkdtemp(path.join(tmpDir, 'roc-upload-'));
  const uploadPath = path.join(uploadDir, filename);
  const file = path.join(dir, filename);
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
  } catch {
    ctx.body = 'error';
    ctx.status = 500;
  }
}

router.post('/upload/:database/:kind/:filename', getHomeDir, async (ctx) => {
  const { database, kind, filename } = ctx.params;
  await writeUpload(ctx, database, kind, filename);
});

router.post('/upload', getHomeDir, async (ctx) => {
  const { database, kind, filename } = ctx.query;
  await writeUpload(ctx, database, kind, filename);
});

function createApp() {
  const config = getGlobalConfig();

  const app = new Koa();
  app.proxy = config.fileDropProxy;
  app.on('error', printError);

  // Unhandled errors
  if (config.debugrest) {
    // In debug mode, show unhandled errors to the user
    app.use(async function debugMiddleware(next) {
      try {
        await next();
      } catch (err) {
        // eslint-disable-next-line no-invalid-this
        this.status = err.status || 500;
        // eslint-disable-next-line no-invalid-this
        this.body = `${err.message}\n${err.stack}`;
        printError(err);
      }
    });
  }

  // Main routes
  app.use(router.routes());

  return app;
}

function printError(err) {
  debug.error('unexpected error:', err.stack || err);
}

let _started;

function start() {
  if (_started) return _started;
  _started = new Promise((resolve) => {
    const config = getGlobalConfig();
    const app = getApp();
    http.createServer(app.callback()).listen(config.fileDropPort, () => {
      debug.warn('file-drop running on localhost:%s', config.fileDropPort);
      resolve(app);
    });
  });
  return _started;
}

let _app;

function getApp() {
  _app ??= createApp();
  return _app;
}

module.exports = {
  start,
  getApp,
};
