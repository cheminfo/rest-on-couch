'use strict';

process.on('unhandledRejection', function (reason, p) {
    console.error('Unhandled Rejection at: Promise ', p, 'reason: ', reason);
    throw p;
});

process.env.REST_ON_COUCH_CONFIG = __dirname + '/.rest-on-couch-config';

const server = require('../lib/server/server');
const supertest = require('supertest-as-promised')(Promise);

exports.getAgent = function () {
    return supertest.agent(server.app.callback());
};
