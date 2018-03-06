'use strict';
const anyuserData = require('../data/anyuser');
const noRights = require('../data/noRights');

describe('Access based on global rights', () => {
  beforeAll(anyuserData);

  test('Should grant read access to any logged user', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('Should not grant read access to anonymous', () => {
    return couch.getEntry('A', 'anonymous').should.be.rejectedWith(/no access/);
  });
});

describe('Edit global rights', () => {
  beforeAll(noRights);

  test('Should refuse non-admins', () => {
    return couch
      .addGlobalRight('a@a.com', 'read', 'a@a.com')
      .should.be.rejectedWith(/administrators/);
  });

  test('Should only accept valid types', () => {
    return couch
      .addGlobalRight('admin@a.com', 'invalid', 'a@a.com')
      .should.be.rejectedWith(/Invalid global right type/);
  });

  test('Should not grant read before editing global right', () => {
    return couch.getEntry('B', 'a@a.com').should.be.rejectedWith(/no access/);
  });

  test('Should add global read right and grant access', () => {
    return couch
      .addGlobalRight('admin@a.com', 'read', 'a@a.com')
      .then(() => couch.getEntry('B', 'a@a.com'))
      .should.eventually.be.an.instanceOf(Object);
  });

  test(
    'Should remove global read right and not grant access anymore',
    () => {
      return couch
        .removeGlobalRight('admin@a.com', 'read', 'a@a.com')
        .then(() => couch.getEntry('B', 'a@a.com'))
        .should.be.rejectedWith(/no access/);
    }
  );
});
