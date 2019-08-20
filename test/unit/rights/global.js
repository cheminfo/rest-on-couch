'use strict';

const anyuserData = require('../../data/anyuser');
const noRights = require('../../data/noRights');

describe('Access based on global rights', () => {
  beforeEach(anyuserData);

  test('Should grant read access to any logged user', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('Should not grant read access to anonymous', () => {
    return expect(couch.getEntry('A', 'anonymous')).rejects.toThrow(
      /no access/,
    );
  });
});

describe('Edit global rights', () => {
  beforeEach(noRights);

  test('Should refuse non-admins', () => {
    return expect(
      couch.addGlobalRight('a@a.com', 'read', 'a@a.com'),
    ).rejects.toThrow(/administrators/);
  });

  test('Should only accept valid types', () => {
    return expect(
      couch.addGlobalRight('admin@a.com', 'invalid', 'a@a.com'),
    ).rejects.toThrow(/Invalid global right type/);
  });

  test('Should not grant read before editing global right', () => {
    return expect(couch.getEntry('B', 'a@a.com')).rejects.toThrow(/no access/);
  });

  test('Should add global read right and grant access', () => {
    return expect(
      couch
        .addGlobalRight('admin@a.com', 'read', 'a@a.com')
        .then(() => couch.getEntry('B', 'a@a.com')),
    ).resolves.toBeDefined();
  });

  test('Should remove global read right and not grant access anymore', () => {
    return expect(
      couch
        .removeGlobalRight('admin@a.com', 'read', 'a@a.com')
        .then(() => couch.getEntry('B', 'a@a.com')),
    ).rejects.toThrow(/no access/);
  });
});
