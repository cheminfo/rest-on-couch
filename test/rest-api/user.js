'use strict';

const data = require('../data/data');
const authenticateAs = require('./authenticate');
const request = require('../setup').getAgent();

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
        res.body.user.should.equal('a@a.com');
        res.body.val.should.equal('a');
      });
  });

  test('Should save user details', () => {
    return request
      .post('/db/test/user/_me')
      .send({ val: 'x' })
      .expect(200)
      .then((res) => {
        res.body.rev.should.startWith('2');
        return couch.getUser('a@a.com').then((user) => {
          user.val.should.equal('x');
        });
      });
  });
});
