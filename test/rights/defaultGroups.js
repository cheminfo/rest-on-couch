'use strict';

const data = require('../data/noRights');

describe('entry reads, database with default groups', () => {
  beforeAll(data);

  test('should grant read access to owner', () => {
    return couch
      .getEntry('entryWithDefaultAnonymousRead', 'x@x.com')
      .should.eventually.be.an.Object();
  });

  test('should grant read access to anonymous user', () => {
    return couch
      .getEntry('entryWithDefaultAnonymousRead', 'anonymous')
      .should.eventually.be.an.Object();
  });

  test('should grant read access to logged in user', () => {
    return couch
      .getEntry('entryWithDefaultAnyuserRead', 'a@a.com')
      .should.eventually.be.an.Object();
  });

  test('should not grant read access to anonymous user', () => {
    return couch
      .getEntry('entryWithDefaultAnyuserRead', 'anonymous')
      .should.be.rejectedWith(/no access/);
  });

  test(
    'should grant read access to anonymous user (multiple groups)',
    () => {
      return couch
        .getEntry('entryWithDefaultMultiRead', 'anonymous')
        .should.eventually.be.an.Object();
    }
  );
});
