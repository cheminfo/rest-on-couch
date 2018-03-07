'use strict';

const data = require('../data/data');
const authenticateAs = require('../utils/authenticate');
const request = require('../setup/setup').getAgent();

describe('User REST-api (data, anonymous)', () => {
  beforeAll(data);
  test('Should return 404 if anonymous', () => {
    request.get('/db/test/user/_me').expect(404);
  });

  // TODO: save user as anonymous. What status code?
});

describe('User REST-api (data, a@a.com', () => {
  beforeAll(() => {
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
        expect(res.body.rev).to.startWith('2');
        return couch.getUser('a@a.com').then((user) => {
          expect(user.val).toBe('x');
        });
      });
  });
});
