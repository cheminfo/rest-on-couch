'use strict';

const data = require('./data/data');

describe('Couch user API', () => {
  beforeAll(data);
  test('Should get a user', () => {
    return couch.getUser('a@a.com').then((doc) => {
      doc.user.should.equal('a@a.com');
    });
  });

  test('Get user should throw if not exists', () => {
    return couch.getUser('b@b.com').should.be.rejectedWith(/not found/);
  });

  test('Edit user should throw when anonymous', () => {
    return couch
      .editUser('anonymous', { val: 'test' })
      .should.be.rejectedWith(/must be an email/);
  });

  test('Should save new  user', () => {
    return couch
      .editUser('b@b.com', { val: 'b', v: 'b' })
      .then((res) => {
        res.rev.should.startWith('1');
      })
      .then(() => {
        return couch.getUser('b@b.com').then((doc) => {
          doc.user.should.equal('b@b.com');
          doc.val.should.equal('b');
        });
      });
  });

  test('Should edit existing user', () => {
    return couch
      .editUser('b@b.com', { val: 'x' })
      .then((res) => {
        res.rev.should.startWith('2');
      })
      .then(() => {
        return couch.getUser('b@b.com').then((doc) => {
          doc.user.should.equal('b@b.com');
          doc.val.should.equal('x');
          doc.v.should.equal('b');
        });
      });
  });

  test('getUserInfo', () => {
    return couch.getUserInfo('user@test.com').then((user) => {
      user.email.should.equal('user@test.com');
      user.value.should.equal(42);
    });
  });
});
