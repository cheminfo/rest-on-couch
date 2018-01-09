'use strict';

const data = require('./data/data');

describe('Couch user API', function () {
  before(data);
  it('Should get a user', function () {
    return couch.getUser('a@a.com').then((doc) => {
      doc.user.should.equal('a@a.com');
    });
  });

  it('Get user should throw if not exists', function () {
    return couch.getUser('b@b.com').should.be.rejectedWith(/not found/);
  });

  it('Edit user should throw when anonymous', function () {
    return couch
      .editUser('anonymous', { val: 'test' })
      .should.be.rejectedWith(/must be an email/);
  });

  it('Should save new  user', function () {
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

  it('Should edit existing user', function () {
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

  it('getUserInfo', function () {
    return couch.getUserInfo('user@test.com').then((user) => {
      user.email.should.equal('user@test.com');
      user.value.should.equal(42);
    });
  });
});
