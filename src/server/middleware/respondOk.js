'use strict';

const OK = { ok: true };

function respondOk(ctx, status = 200) {
  ctx.status = status;
  ctx.body = OK;
}

module.exports = respondOk;
