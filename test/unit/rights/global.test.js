import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import anyuserData from '../../data/anyuser.js';
import noRights from '../../data/noRights.js';

describe('Access based on global rights', () => {
  beforeEach(anyuserData);

  it('Should grant read access to any logged user', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('Should not grant read access to anonymous', () => {
    return expect(couch.getEntry('A', 'anonymous')).rejects.toThrow(
      /no access/,
    );
  });
});

describe('Edit global rights', () => {
  beforeEach(noRights);

  it('Should refuse non-admins', () => {
    return expect(
      couch.addGlobalRight('a@a.com', 'read', 'a@a.com'),
    ).rejects.toThrow(/administrators/);
  });

  it('Should only accept valid types', () => {
    return expect(
      couch.addGlobalRight('admin@a.com', 'invalid', 'a@a.com'),
    ).rejects.toThrow(/Invalid global right type/);
  });

  it('Should not grant read before editing global right', () => {
    return expect(couch.getEntry('onlyB', 'a@a.com')).rejects.toThrow(
      /no access/,
    );
  });

  it('Should add global read right and grant access', () => {
    return expect(
      couch
        .addGlobalRight('admin@a.com', 'read', 'a@a.com')
        .then(() => couch.getEntry('onlyB', 'a@a.com')),
    ).resolves.toBeDefined();
  });

  it('Should remove global read right and not grant access anymore', () => {
    return expect(
      couch
        .removeGlobalRight('admin@a.com', 'read', 'a@a.com')
        .then(() => couch.getEntry('onlyB', 'a@a.com')),
    ).rejects.toThrow(/no access/);
  });
});
