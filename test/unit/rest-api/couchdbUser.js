'use strict';

const config = require('../../../src/config/config').globalConfig;
const getNano = require('../../../src/util/nanoShim');
const request = require('../../setup/setup').getAgent();
const authenticateCouchDB = require('../../utils/authenticateCouchDB');

let nano;
beforeAll(async () => {
  nano = await getNano(config.url, 'admin', config.adminPassword);
  const db = nano.useDb('_users');
  await db.destroyDocument('org.couchdb.user:test@user.com');
});

describe('couchdb users as super admin', () => {
  beforeEach(async () => {
    await authenticateCouchDB(request, 'admin@a.com', '123');
  });
  test('create a new user', async () => {
    await request
      .post('/auth/couchdb/user')
      .send({
        email: 'test@user.com',
        password: 'abc',
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual({ ok: true });
      });
  });
});
