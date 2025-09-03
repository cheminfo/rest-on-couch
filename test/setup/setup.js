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

export function getAgent() {
  return supertest.agent(getMainApp().callback());
}

export function getFileDropAgent() {
  return supertest.agent(getFileDropApp().callback());
}
