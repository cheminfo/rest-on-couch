import supertest from 'supertest';
import { getApp as getMainApp } from '../../src/server/server.js';
import { getApp as getFileDropApp } from '../../src/file-drop/server.js';

export function getAgent() {
  return supertest.agent(getMainApp().callback());
}

export function getFileDropAgent() {
  return supertest.agent(getFileDropApp().callback());
}
