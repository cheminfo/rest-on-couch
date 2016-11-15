'use strict';

const bodyParser = require('koa-body');
const rawBody = require('raw-body');

exports.parseBody = function (options) {
    return bodyParser(options);
};

exports.parseRawBody = function (options) {
    return function*(next) {
        this.request.body = yield rawBody(this.req, options);
        yield next;
    };
};

exports.getUuidFromGroupName = function*(next) {
    this.params.uuid = yield this.state.couch.getDocUuidFromId(this.params.name, this.state.userEmail, 'group');
    yield next;
};
