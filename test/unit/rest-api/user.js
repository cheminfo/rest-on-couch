'use strict';

const data = require('../../data/data');
const request = require('../../setup/setup').getAgent();
const authenticateAs = require('../../utils/authenticate');

describe('User REST-api (data, anonymous)', () => {
  beforeEach(data);
  test('Should return 404 if anonymous', () => {
    return request.get('/db/test/user/_me').expect(404);
  });

  // TODO: save user as anonymous. What status code?
});

describe('User REST-api (token)', () => {
  beforeEach(data);
  test('Should be able to PUT', () => {
    return request
      .put('/db/test/entry/documentOfA/blub.txt?token=myAddAttachmentToken')
      .set('Content-Type', 'text/plain')
      .send('rest-on-couch!!')
      .expect(200);
  });

  test('Should be able to PUT but not without the right in the token', () => {
    return request
      .put('/db/test/entry/documentOfA/blub.txt?token=myReadOnlyToken')
      .set('Content-Type', 'text/plain')
      .send('rest-on-couch!!')
      .expect(401);
  });

  test('Should be able to GET with the token', () => {
    return request
      .get('/db/test/entry/A?token=myAddAttachmentToken')
      .expect(200);
  });

  test('Should be able to update document with user token', () => {
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
});

describe('User REST-api (data, a@a.com', () => {
  beforeEach(() => {
    return data().then(() => authenticateAs(request, 'a@a.com', '123'));
  });

  test('Should get user details', () => {
    return request
      .get('/db/test/user/_me')
      .expect(200)
      .then((res) => {
        expect(res.body.user).toBe('a@a.com');
        expect(res.body.val).toBe('a');
      });
  });

  test('Should save user details', () => {
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
