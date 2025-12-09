import { beforeAll, describe, expect, test } from 'vitest';

import pkg from '../package.json' with { type: 'json' };

import data from './data/data.js';
import noRights from './data/noRights.js';
import { getAgent } from './setup/setup.js';
import { authenticateAs, logout } from './utils/authenticateCouchDB.js';

const request = getAgent();

describe('basic rest-api as anonymous (noRights)', () => {
  beforeAll(async () => {
    await noRights();
    await logout(request);
  });

  test('get an entry', async () => {
    await request.get('/db/test/entry/A').expect(401);
  });

  test('get an entry with token', async () => {
    await request.get('/db/test/entry/A?token=mytoken').expect(200);
  });

  test('get an entry with token (wrong uuid)', async () => {
    await request.get('/db/test/entry/onlyB?token=mytoken').expect(401);
  });

  test('get an entry with token (inexisting token)', async () => {
    await request.get('/db/test/entry/onlyB?token=notexist').expect(401);
  });

  test('not allowed to delete an entry', async () => {
    await request.delete('/db/test/entry/onlyB?token=mytoken').expect(401);
  });

  test('not allowed to create an entry', async () => {
    await request
      .post('/db/test/entry?token=mytoken')
      .send({ $id: 'XXX', $content: { value: 42 } })
      .expect(401);
  });

  test('not allowed to create a token', async () => {
    await request.post('/db/test/entry/A/_token').expect(401);
  });

  test('get all entries', async () => {
    const response = await request.get('/db/test/entry/_all').expect(200);
    expect(response.body).toHaveLength(2);
  });

  test('get unknown group', async () => {
    await request.get('/db/test/group/doesnotexist').expect(404);
  });

  test('get group without permission', async () => {
    await request.get('/db/test/group/groupA').expect(401);
  });

  test('_all_dbs', async () => {
    const data = await request.get('/db/_all_dbs').expect(200);
    expect(data.body).toHaveProperty('length');
  });

  test('_version', async () => {
    const data = await request.get('/db/_version').expect(200);
    expect(data.text).toStrictEqual(pkg.version);
  });

  test('forbidden database names', async () => {
    const data = await request.get('/db/_a$aa/entry/aaa').expect(403);
    expect(data.body).toMatchObject({
      error: 'invalid database name',
      code: 'forbidden',
    });
  });
});

describe('rest-api as b@b.com (noRights)', () => {
  beforeAll(async () => {
    await noRights();
    await authenticateAs(request, 'b@b.com', '123');
  });

  test('query view with owner, wrong key', async () => {
    const rows = await request
      .get('/db/test/_query/entryIdByRight?key=xxx')
      .expect(200);
    expect(rows.text).toBe('[]');
  });

  test('query view with owner', async () => {
    const rows = await request
      .get(
        `/db/test/_query/entryIdByRight?key=${encodeURIComponent(
          JSON.stringify(['x', 'y', 'z']),
        )}`,
      )
      .expect(200);
    expect(rows.text).not.toBe('[]');
  });

  test('get an entry authenticated', async () => {
    await request.get('/db/test/entry/onlyB').expect(200);
  });

  test('get an entry authenticated but asAnonymous', async () => {
    await request.get('/db/test/entry/onlyB?asAnonymous=true').expect(401);
  });

  test('check if user has read access to a resource', async () => {
    const data = await request
      .get('/db/test/entry/onlyB/_rights/read')
      .expect(200);
    expect(data.body).toBe(true);
  });

  test('check if user has write access to a resource (as anonymous)', async () => {
    const data = await request
      .get('/db/test/entry/onlyB/_rights/read?asAnonymous=1')
      .expect(200);
    expect(data.body).toBe(false);
  });
});

describe('rest-api as anonymous (data)', () => {
  beforeAll(async () => {
    await data();
    await logout(request);
  });

  test('save and delete an attachment', async () => {
    await authenticateAs(request, 'a@a.com', '123');
    // The attachment name intentionally has an encoded + to make sure URLs are
    // correctly encoded and decoded by the API.
    let res = await request
      .put('/db/test/entry/B/my%2Battachment.txt')
      .set('Content-Type', 'text/plain')
      .set('Accept', 'application/json')
      .send('rest-on-couch!!')
      .expect(200);

    expect(res.body.id).toBe('B');
    expect(res.body.rev).toMatch(/^2/);
    await logout(request);

    const doc = await request.get('/db/test/entry/B');
    expect(doc.body._attachments['my+attachment.txt']).not.toBe(undefined);

    res = await request.get('/db/test/entry/B/my%2Battachment.txt');
    expect(res.text).toBe('rest-on-couch!!');
    expect(res.headers['content-type']).toBe('text/plain');

    await authenticateAs(request, 'a@a.com', '123');
    await request
      .delete('/db/test/entry/B/my%2Battachment.txt')
      .send()
      .expect(200);
    await logout(request);

    await request.get('/db/test/entry/B/my%2Battachment.txt').expect(404);
  });

  test('handle attachment names with unescaped slashes', async () => {
    await authenticateAs(request, 'a@a.com', '123');
    // The attachment name intentionally has an encoded + to make sure URLs are
    // correctly encoded and decoded by the API.
    let res = await request
      .put('/db/test/entry/B/my/attachment.txt')
      .set('Content-Type', 'text/plain')
      .set('Accept', 'application/json')
      .send('rest-on-couch!!')
      .expect(200);

    expect(res.body.id).toBe('B');

    // Unescaped
    res = await request.get('/db/test/entry/B/my/attachment.txt');
    expect(res.text).toBe('rest-on-couch!!');
    expect(res.headers['content-type']).toBe('text/plain');

    // Escaped
    res = await request.get('/db/test/entry/B/my%2Fattachment.txt');
    expect(res.text).toBe('rest-on-couch!!');

    await authenticateAs(request, 'a@a.com', '123');
    await request
      .delete('/db/test/entry/B/my/attachment.txt')
      .send()
      .expect(200);
    await logout(request);

    await request.get('/db/test/entry/B/my/attachment.txt').expect(404);
  });
});

describe('basic rest-api as b@b.com (data)', () => {
  beforeAll(async () => {
    await data();
    await authenticateAs(request, 'b@b.com', '123');
  });

  test('head existing entry', async () => {
    const entry = await couch.getEntryById('A', 'b@b.com');
    await request
      .head(`/db/test/entry/${entry._id}`)
      .expect(200)
      .expect('ETag', `"${entry._rev}"`);
  });

  test('head non-existing entry', async () => {
    await request.head('/db/test/entry/bad').expect(404);
  });

  test('head with if-none-match', async () => {
    const entry = await couch.getEntryById('A', 'b@b.com');
    await request
      .head(`/db/test/entry/${entry._id}`)
      .set('If-None-Match', `"${entry._rev}"`)
      .expect(304)
      .expect('ETag', `"${entry._rev}"`);
  });

  test('get an entry', async () => {
    const entry = await couch.getEntryById('A', 'b@b.com');
    await request.get(`/db/test/entry/${entry._id}`).expect(200);
  });

  test('get all entries', async () => {
    const response = await request.get('/db/test/entry/_all').expect(200);
    expect(response.body).toHaveLength(6);
  });

  test('query view', async () => {
    const response = await request
      .get('/db/test/_view/entryById?key=%22A%22')
      .expect(200);
    expect(response.body).toHaveLength(1);
  });

  test('query view with reduce', async () => {
    const response = await request
      .get('/db/test/_view/entryById?reduce=true')
      .expect(200);
    expect(response.body[0].value).toBe(6);
  });

  test('create new document', async () => {
    const result = await request
      .post('/db/test/entry')
      .send({ $id: 'new', $content: {} })
      .expect(201);
    expect(result.body).toBeInstanceOf(Object);
    expect(result.body).toHaveProperty('rev');
  });

  test('non-existent document cannot be updated', async () => {
    // document with uuid A does not exist
    await request
      .put('/db/test/entry/NOTEXIST')
      .send({ $id: 'NOTEXIST', $content: {} })
      .expect(404);
  });

  test('existent document cannot be update if no write access', async () => {
    // Update document for which user has no access
    await request
      .put('/db/test/entry/B')
      .send({ $id: 'B', $content: {} })
      .expect(401);
  });

  test('update existing document with no _rev return 409 (conflict)', async () => {
    await request
      .put('/db/test/entry/C')
      .send({ $id: 'C', $content: {} })
      .expect(409);
  });

  test('update document', async () => {
    const entry = await couch.getEntryById('C', 'b@b.com');
    const res = await request
      .put('/db/test/entry/C')
      .send({ $id: 'C', $content: {}, _rev: entry._rev })
      .expect(200);
    expect(res.body).toHaveProperty('rev');
    expect(res.body.rev).toMatch(/^2/);
  });

  test('create token', async () => {
    await request.post('/db/test/entry/C/_token').expect(201);
  });

  test('delete document', async () => {
    const res = await request.del('/db/test/entry/C').expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('get group without permission', async () => {
    await request.get('/db/test/group/groupA').expect(401);
  });
});

describe('basic rest-api as a@a.com (data)', () => {
  beforeAll(async () => {
    await data();
    await authenticateAs(request, 'a@a.com', '123');
  });

  test('get group with permission', async () => {
    const response = await request.get('/db/test/group/groupA').expect(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('rights');
  });

  test('get list of groups', async () => {
    const response = await request.get('/db/test/groups').expect(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toBeDefined();
  });
});
