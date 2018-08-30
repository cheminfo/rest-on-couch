'use strict';

const statusMessages = {
  400: 'bad request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not found',
  409: 'conflict',
  500: 'internal server error'
};

function decorateError(ctx, status, error = true) {
  ctx.status = status;
  if (responseHasBody(ctx)) {
    ctx.body = {
      error,
      code: statusMessages[status] || `error ${status}`
    };
  }
}

function responseHasBody(ctx) {
  const method = ctx.method;
  if (method === 'HEAD' || method === 'OPTIONS') return false;
  return true;
}

module.exports = { decorateError, responseHasBody };
