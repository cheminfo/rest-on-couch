'use strict';

const path = require('path');

const dotenv = require('dotenv');
const supertest = require('supertest');

require('make-promises-safe');

dotenv.config({
  path: './.env.test',
});

process.env.REST_ON_COUCH_HOME_DIR = path.join(
  __dirname,
  '../homeDirectories/main',
);

const fileDropServer = require('../../src/file-drop/server');
const server = require('../../src/server/server');

exports.getAgent = function () {
  return supertest.agent(server.app.callback());
};

exports.getFileDropAgent = function () {
  return supertest.agent(fileDropServer.app.callback());
};
