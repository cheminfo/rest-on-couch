'use strict';

const data = require('../data/noRights');
const constants = require('../data/constants');

describe('entry reads, database without any default rights', () => {
  beforeAll(data);

  test('should grant read access to group member with read access', () => {
    return couch
      .getEntry('A', 'a@a.com')
      .should.eventually.be.an.instanceOf(Object);
  });

  test('should not grant read access to inexistant user', () => {
    return couch.getEntry('A', 'z@z.com').should.be.rejectedWith(/no access/);
  });

  test('owner of entry should have access to it', () => {
    return couch
      .getEntry('A', 'b@b.com')
      .should.eventually.be.an.instanceOf(Object);
  });

  test('non-read member should not have access to entry', () => {
    return couch.getEntry('A', 'c@c.com').should.be.rejectedWith(/no access/);
  });

  test('non-read member should not have access to entry (by uuid)', () => {
    return couch.getEntry('A', 'c@c.com').should.be.rejectedWith(/no access/);
  });

  test('should only get entries for which user has read access', () => {
    return couch.getEntriesByUserAndRights('a@a.com', 'read').then((entries) => {
      entries.should.have.length(5);
      entries[0].$id.should.equal('A');
    });
  });

  test('should reject anonymous user', () => {
    return couch.getEntry('A', 'anonymous').should.be.rejectedWith(/no access/);
  });
});

describe('entry editions, database without any default rights', () => {
  beforeAll(data);

  test('any user is not allowed to create entry', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com')
      .should.be.rejectedWith(/not allowed to create/);
  });
});
