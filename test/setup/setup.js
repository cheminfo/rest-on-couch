'use strict';

require('make-promises-safe');
const path = require('path');

process.env.REST_ON_COUCH_HOME_DIR = path.join(__dirname, '../homedir');

// require('../src/util/load')();
const server = require('../../src/server/server');
const fileDropServer = require('../../src/file-drop/server');
const supertest = require('supertest');

exports.getAgent = function () {
  return supertest.agent(server.app.callback());
};

exports.getFileDropAgent = function () {
  return supertest.agent(fileDropServer.app.callback());
};
