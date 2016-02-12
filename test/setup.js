'use strict';

process.on('unhandledRejection', function (reason, p) {
    throw p;
});

process.env.REST_ON_COUCH_HOME_DIR = __dirname + '/homedir';

const server = require('../lib/server/server');
const supertest = require('supertest-as-promised')(Promise);

exports.getAgent = function () {
    return supertest.agent(server.app.callback());
};
