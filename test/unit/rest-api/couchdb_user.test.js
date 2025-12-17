import { before, beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import { getGlobalConfig } from '../../../src/config/config.js';
import getNano from '../../../src/util/nanoShim.js';
import { authenticateAs } from '../../utils/authenticate.js';
import { getAgent } from '../../utils/agent.js';

const request = getAgent();

let nano;
before(async () => {
  const config = getGlobalConfig();
  nano = await getNano(config.url, 'admin', config.adminPassword);
  const db = nano.useDb('_users');
  await db.destroyDocument('org.couchdb.user:test@user.com');
});

describe('administrators can configure couchdb users', () => {
  beforeEach(async () => {
    await authenticateAs(request, 'admin@a.com', '123');
  });

  it('create a new user', async () => {
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

describe('non-administrators cannot configure couchdb users', () => {
  beforeEach(async () => {
    await authenticateAs(request, 'a@a.com', '123');
  });

  it('cannot create a new user', async () => {
    await request
      .post('/auth/couchdb/user')
      .send({
        email: 'test@user.com',
        password: 'abc',
      })
      .expect(403)
      .then((res) => {
        expect(res.body).toEqual({
          code: 'forbidden',
          error: 'restricted to administrators',
        });
      });
  });
});
