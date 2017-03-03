'use strict';

const bodyParser = require('koa-body');
const rawBody = require('raw-body');

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
    ctx.params.uuid = await ctx.state.couch.getDocUuidFromId(ctx.params.name, ctx.state.userEmail, 'group');
    await next();
};
