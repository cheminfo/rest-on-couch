'use strict';

const { loadEnvFile } = require('node:process');
const path = require('path');

const supertest = require('supertest');


loadEnvFile('.env.test');

process.env.REST_ON_COUCH_HOME_DIR = path.join(
  __dirname,
  '../homeDirectories/main',
);

const fileDropServer = require('../../src/file-drop/server');
const server = require('../../src/server/server');

exports.getAgent = function getAgent() {
  return supertest.agent(server.app.callback());
};

exports.getFileDropAgent = function getFileDropAgent() {
  return supertest.agent(fileDropServer.app.callback());
};
