import { beforeAll, describe, expect, test } from 'vitest';

import constants from '../../data/constants.js';
import data from '../../data/noRights.js';

describe('entry reads, database without any default rights', () => {
  beforeAll(data);

  test('should grant read access to group member with read access', () => {
    return expect(couch.getEntry('A', 'a@a.com')).resolves.toBeInstanceOf(
      Object,
    );
  });

  test('should not grant read access to inexistant user', () => {
    return expect(couch.getEntry('A', 'z@z.com')).rejects.toThrow(/no access/);
  });

  test('owner of entry should have access to it', () => {
    return expect(couch.getEntry('A', 'b@b.com')).toBeInstanceOf(Object);
  });

  test('non-read member should not have access to entry', () => {
    return expect(couch.getEntry('A', 'c@c.com')).rejects.toThrow(/no access/);
  });

  test('non-read member should not have access to entry (by uuid)', () => {
    return expect(couch.getEntry('A', 'c@c.com')).rejects.toThrow(/no access/);
  });

  test('should only get entries for which user has read access', () => {
    return couch
      .getEntriesByUserAndRights('a@a.com', 'read')
      .then((entries) => {
        expect(entries).toHaveLength(5);
        expect(entries[0].$id).toBe('A');
      });
  });

  test('should reject anonymous user', () => {
    return expect(couch.getEntry('A', 'anonymous')).rejects.toThrow(
      /no access/,
    );
  });
});

describe('entry editions, database without any default rights', () => {
  beforeAll(data);

  test('any user is not allowed to create entry', () => {
    return expect(
      couch.insertEntry(constants.newEntry, 'z@z.com'),
    ).rejects.toThrow(/not allowed to create/);
  });
});
