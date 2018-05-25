'use strict';

const bodyParser = require('koa-bodyparser');
const rawBody = require('raw-body');
const compose = require('koa-compose');

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('middleware:util');

const decorateError = require('./decorateError');

exports.parseBody = function (options) {
  return bodyParser(options);
};

exports.parseRawBody = function (options) {
  return async (ctx, next) => {
    ctx.request.body = await rawBody(ctx.req, options);
    await next();
  };
};

exports.getUuidFromGroupName = async (ctx, next) => {
  ctx.params.uuid = await ctx.state.couch.getDocUuidFromId(
    ctx.params.name,
    ctx.state.userEmail,
    'group'
  );
  await next();
};

exports.getGroupFromGroupName = async (ctx, next) => {
  ctx.params.group = await ctx.state.couch.getGroup(
    ctx.params.name,
    ctx.state.userEmail
  );
  await next();
};

exports.composeWithError = function composeWithError(middleware) {
  return compose([errorMiddleware, middleware]);
};

function onGetError(ctx, e, secure) {
  switch (e.reason) {
    case 'unauthorized':
      if (!secure) {
        decorateError(ctx, 401, e.message);
        break;
      }
    // fallthrough
    case 'not found':
      decorateError(ctx, 404, e.message);
      break;
    case 'conflict':
      decorateError(ctx, 409, e.message);
      break;
    case 'invalid':
      decorateError(ctx, 400, e.message);
      break;
    case 'forbidden':
      decorateError(ctx, 403, e.message);
      break;
    default:
      if (!handleCouchError(ctx, e, secure)) {
        decorateError(ctx, 500, e.message);
        debug.error(e + e.stack);
      }
      break;
  }
  if (config.debugrest) {
    ctx.body.stack = e.stack;
  }
}
exports.onGetError = onGetError;

async function errorMiddleware(ctx, next) {
  try {
    await next();
  } catch (e) {
    onGetError(ctx, e);
  }
}

function handleCouchError(ctx, e, secure) {
  if (e.scope !== 'couch') {
    return false;
  }
  var statusCode = e.statusCode;
  if (statusCode) {
    if (statusCode === 404 && secure) {
      statusCode = 401;
    }

    if (statusCode === 500) {
      debug.error(e + e.stack);
    }

    decorateError(ctx, statusCode, e.message);
    return true;
  }
  return false;
}
