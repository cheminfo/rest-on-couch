'use strict';

const request = require('./setup/setup').getAgent();
const noRights = require('./data/noRights');
const data = require('./data/data');
const authenticateAs = require('./utils/authenticate');

describe('basic rest-api as anonymous (noRights)', () => {
  beforeEach(noRights);

  test('get an entry', () => {
    return request.get('/db/test/entry/A').expect(401);
  });

  test('get an entry with token', () => {
    return request.get('/db/test/entry/A?token=mytoken').expect(200);
  });

  test('get an entry with token (wrong uuid)', () => {
    return request.get('/db/test/entry/B?token=mytoken').expect(401);
  });

  test('get an entry with token (inexisting token)', () => {
    return request.get('/db/test/entry/B?token=notexist').expect(401);
  });

  test('not allowed to create a token', () => {
    return request.post('/db/test/entry/A/_token').expect(401);
  });

  test('get all entries', () => {
    return request
      .get('/db/test/entry/_all')
      .expect(200)
      .then((entries) => {
        entries = JSON.parse(entries.text);
        expect(entries).toHaveLength(2);
      });
  });

  test('get unknown group', () => {
    return request.get('/db/test/group/doesnotexist').expect(404);
  });

  test('get group without permission', () => {
    return request.get('/db/test/group/groupA').expect(401);
  });

  test('_all_dbs', () => {
    return request
      .get('/db/_all_dbs')
      .expect(200)
      .then((data) => {
        expect(data.body).toHaveProperty('length');
      });
  });

  test('forbidden datbase names', () => {
    return request
      .get('/db/_a$aa/entry/aaa')
      .expect(403)
      .then((data) => {
        expect(data.body).toMatchObject({
          error: 'invalid database name',
          code: 'forbidden',
        });
      });
  });
});

describe('rest-api as b@b.com (noRights)', () => {
  beforeEach(() => {
    return noRights().then(() => authenticateAs(request, 'b@b.com', '123'));
  });

  test('query view with owner, wrong key', () => {
    return request
      .get('/db/test/_query/entryIdByRight?key=xxx')
      .expect(200)
      .then((rows) => {
        expect(rows.text).toBe('[]');
      });
  });

  test('query view with owner', () => {
    return request
      .get(
        `/db/test/_query/entryIdByRight?key=${encodeURIComponent(
          JSON.stringify(['x', 'y', 'z']),
        )}`,
      )
      .expect(200)
      .then((rows) => {
        expect(rows.text).not.toBe('[]');
      });
  });

  test('get an entry authenticated', () => {
    return request.get('/db/test/entry/B').expect(200);
  });

  test('get an entry authenticated but asAnonymous', () => {
    return request.get('/db/test/entry/B?asAnonymous=true').expect(401);
  });

  test('check if user has read access to a resource', () => {
    return request
      .get('/db/test/entry/B/_rights/read')
      .expect(200)
      .then((data) => expect(data.body).toBe(true));
  });

  test('check if user has write access to a resource (as anonymous)', () => {
    return request
      .get('/db/test/entry/B/_rights/read?asAnonymous=1')
      .expect(200)
      .then((data) => expect(data.body).toBe(false));
  });
});

describe('rest-api as anonymous (data)', () => {
  beforeEach(data);

  test('save and delete an attachment', async () => {
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

    const doc = await request.get('/db/test/entry/B');
    expect(doc.body._attachements['my+attachment.txt']).not.toBe(undefined);

    res = await request.get('/db/test/entry/B/my%2Battachment.txt');
    expect(res.text).toBe('rest-on-couch!!');
    expect(res.headers['content-type']).toBe('text/plain');

    await request
      .delete('/db/test/entry/B/my%2Battachment.txt')
      .send()
      .expect(200);

    await request.get('/db/test/entry/B/my%2Battachment.txt').expect(404);
  });
});

describe('basic rest-api as b@b.com', () => {
  beforeEach(() => {
    return data().then(() => authenticateAs(request, 'b@b.com', '123'));
  });

  test('head existing entry', async () => {
    const entry = await couch.getEntryById('A', 'b@b.com');
    return request
      .head(`/db/test/entry/${entry._id}`)
      .expect(200)
      .expect('ETag', `"${entry._rev}"`);
  });

  test('head non-existing entry', async () => {
    return request.head('/db/test/entry/bad').expect(404);
  });

  test('head with if-none-match', async () => {
    const entry = await couch.getEntryById('A', 'b@b.com');
    return request
      .head(`/db/test/entry/${entry._id}`)
      .set('If-None-Match', `"${entry._rev}"`)
      .expect(304)
      .expect('ETag', `"${entry._rev}"`);
  });

  test('get an entry', () => {
    return couch.getEntryById('A', 'b@b.com').then((entry) => {
      return request.get(`/db/test/entry/${entry._id}`).expect(200);
    });
  });

  test('get all entries', () => {
    return request
      .get('/db/test/entry/_all')
      .expect(200)
      .then((entries) => {
        entries = JSON.parse(entries.text);
        expect(entries).toHaveLength(5);
      });
  });

  test('query view', () => {
    return request
      .get('/db/test/_view/entryById?key=%22A%22')
      .expect(200)
      .then((rows) => {
        rows = JSON.parse(rows.text);
        expect(rows).toHaveLength(1);
      });
  });

  test('query view with reduce', () => {
    return request
      .get('/db/test/_view/entryById?reduce=true')
      .expect(200)
      .then((rows) => {
        rows = JSON.parse(rows.text);
        expect(rows[0].value).toBe(5);
      });
  });

  test('create new document', () => {
    return request
      .post('/db/test/entry')
      .send({ $id: 'new', $content: {} })
      .expect(201)
      .then((result) => {
        expect(result.body).toBeInstanceOf(Object);
        expect(result.body).toHaveProperty('rev');
      });
  });

  test('non-existent document cannot be updated', () => {
    // document with uuid A does not exist
    return request
      .put('/db/test/entry/NOTEXIST')
      .send({ $id: 'NOTEXIST', $content: {} })
      .expect(404);
  });

  test('existent document cannot be update if no write access', () => {
    // Update document for which user has no access
    return request
      .put('/db/test/entry/B')
      .send({ $id: 'B', $content: {} })
      .expect(401);
  });

  test('update existing document with no _rev return 409 (conflict)', () => {
    return request
      .put('/db/test/entry/C')
      .send({ $id: 'C', $content: {} })
      .expect(409);
  });

  test('update document', () => {
    return couch.getEntryById('C', 'b@b.com').then((entry) => {
      return request
        .put('/db/test/entry/C')
        .send({ $id: 'C', $content: {}, _rev: entry._rev })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('rev');
          expect(res.body.rev).toMatch(/^2/);
        });
    });
  });

  test('create token', () => {
    return request.post('/db/test/entry/C/_token').expect(201);
  });

  test('delete document', () => {
    return request
      .del('/db/test/entry/C')
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual({ ok: true });
      });
  });

  test('get group without permission', () => {
    return request.get('/db/test/group/groupA').expect(401);
  });
});

describe('basic rest-api as a@a.com', () => {
  beforeEach(() => {
    return data().then(() => authenticateAs(request, 'a@a.com', '123'));
  });

  test('get group with permission', () => {
    return request
      .get('/db/test/group/groupA')
      .expect(200)
      .then(function (response) {
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('rights');
      });
  });

  test('get list of groups', () => {
    return request
      .get('/db/test/groups')
      .expect(200)
      .then(function (response) {
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toBeDefined();
      });
  });
});
