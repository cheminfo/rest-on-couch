import { loadEnvFile } from 'node:process';
import path from 'node:path';

import supertest from 'supertest';

import { getApp as getFileDropApp } from '../../src/file-drop/server.js';
import { getApp as getMainApp } from '../../src/server/server.js';

loadEnvFile('.env.test');

process.env.REST_ON_COUCH_HOME_DIR = path.join(
  import.meta.dirname,
  '../homeDirectories/main',
);

const couchRes = await fetch('http://127.0.0.1:5984');
const version = (await couchRes.json()).version;
if (!version) {
  throw new Error('Could not get CouchDB version');
}

export function getAgent() {
  return supertest.agent(getMainApp().callback());
}

export function getFileDropAgent() {
  return supertest.agent(getFileDropApp().callback());
}

export function skipIfCouchV1(context) {
  if (version.startsWith('1.')) {
    context.skip('CouchDB 1.x does not support mango queries');
  }
}

export function getCouchMajorVersion() {
  return parseInt(version[0], 10);
}
