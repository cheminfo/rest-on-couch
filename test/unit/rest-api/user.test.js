import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import data from '../../data/data.js';
import { authenticateAs, authenticateLDAP } from '../../utils/authenticate.js';
import { getAgent } from '../../utils/agent.js';

const request = getAgent();

describe('User REST-api (data, anonymous)', () => {
  beforeEach(data);
  it('Should return 404 if anonymous', () => {
    return request.get('/db/test/user/_me').expect(404);
  });

  // TODO: save user as anonymous. What status code?
});

describe('User REST-api (token)', () => {
  beforeEach(data);
  it('Should be able to PUT', () => {
    return request
      .put('/db/test/entry/documentOfA/blub.txt?token=myAddAttachmentToken')
      .set('Content-Type', 'text/plain')
      .send('rest-on-couch!!')
      .expect(200);
  });

  it('Should be able to PUT but not without the right in the token', () => {
    return request
      .put('/db/test/entry/documentOfA/blub.txt?token=myReadOnlyToken')
      .set('Content-Type', 'text/plain')
      .send('rest-on-couch!!')
      .expect(401);
  });

  it('Should be able to GET with the token', () => {
    return request
      .get('/db/test/entry/A?token=myAddAttachmentToken')
      .expect(200);
  });

  it('Should be able to update document with user token', () => {
    return couch.getEntryById('A', 'b@b.com').then((entry) => {
      return request
        .put('/db/test/entry/A?token=myUserToken')
        .send({ $id: 'A', $content: { something: 'new' }, _rev: entry._rev })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('rev');
          expect(res.body.rev).toMatch(/^2/);
        });
    });
  });

  it('Should be able to create and delete document with user token', async () => {
    const newEntry = await request
      .post('/db/test/entry?token=myUserToken')
      .send({
        $id: 'XXX',
        $content: { value: 42 },
      });
    expect(newEntry.statusCode).toBe(201);
    const id = newEntry.body.id;
    const doc = await request.get(`/db/test/entry/${id}?token=myUserToken`);
    expect(doc.statusCode).toBe(200);
    expect(doc.body.$content).toStrictEqual({ value: 42 });
    await request.delete(`/db/test/entry/${id}?token=myUserToken`).expect(200);
  });
});

describe('User REST-api , a@a.com', () => {
  beforeEach(() => {
    return data().then(() => authenticateAs(request, 'a@a.com', '123'));
  });

  it('Should get user details', () => {
    return request
      .get('/db/test/user/_me')
      .expect(200)
      .then((res) => {
        expect(res.body.user).toBe('a@a.com');
        expect(res.body.val).toBe('a');
      });
  });

  it('Should save user details', () => {
    return request
      .post('/db/test/user/_me')
      .send({ val: 'x' })
      .expect(200)
      .then((res) => {
        expect(res.body.rev).toMatch(/^2/);
        return couch.getUser('a@a.com').then((user) => {
          expect(user.val).toBe('x');
        });
      });
  });
});

describe('LDAP user, developer@zakodium.com', () => {
  beforeEach(() => {
    return data().then(() =>
      authenticateLDAP(request, 'developer', 'developer'),
    );
  });

  it('Should get ldap user details', () => {
    // Ldap users don't store user data
    return request.get('/db/test/user/_me').expect(404);
  });

  it('Should get ldap user info', () => {
    return request
      .get('/db/test/userInfo/_me')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeDefined();
        expect(res.body).toStrictEqual({
          displayName: 'Developer User',
          email: 'developer@zakodium.com',
        });
      });
  });
});
