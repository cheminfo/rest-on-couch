'use strict';

process.env.REST_ON_COUCH_CONFIG = __dirname + '/.rest-on-couch-config';

const server = require('../src/server/server');
const supertest = require('supertest-as-promised')(Promise);

exports.getAgent = function () {
    return supertest.agent(server.app.callback());
};
