'use strict';

require('make-promises-safe');
const path = require('path');

// eslint-disable-next-line no-process-env
process.env.REST_ON_COUCH_HOME_DIR = path.join(
  __dirname,
  '../homeDirectories/main'
);

const supertest = require('supertest');

const server = require('../../src/server/server');
const fileDropServer = require('../../src/file-drop/server');

exports.getAgent = function () {
  return supertest.agent(server.app.callback());
};

exports.getFileDropAgent = function () {
  return supertest.agent(fileDropServer.app.callback());
};
