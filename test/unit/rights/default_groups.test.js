import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import data from '../../data/noRights.js';

describe('entry reads, database with default groups', () => {
  beforeEach(data);

  it('should grant read access to owner', () => {
    return expect(
      couch.getEntry('entryWithDefaultAnonymousRead', 'x@x.com'),
    ).resolves.toBeDefined();
  });

  it('should grant read access to anonymous user', () => {
    return expect(
      couch.getEntry('entryWithDefaultAnonymousRead', 'anonymous'),
    ).resolves.toBeDefined();
  });

  it('should grant read access to logged in user', () => {
    return expect(
      couch.getEntry('entryWithDefaultAnyuserRead', 'a@a.com'),
    ).resolves.toBeDefined();
  });

  it('should not grant read access to anonymous user', () => {
    return expect(
      couch.getEntry('entryWithDefaultAnyuserRead', 'anonymous'),
    ).rejects.toThrow(/no access/);
  });

  it('should grant read access to anonymous user (multiple groups)', () => {
    return expect(
      couch.getEntry('entryWithDefaultMultiRead', 'anonymous'),
    ).resolves.toBeDefined();
  });
});
