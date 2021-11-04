'use strict';

const entryUnicity = require('../data/entryUnicity');

describe('global entry unicity', () => {
  beforeEach(entryUnicity);
  test('ensureExistsOrCreateEntry should fail', () => {
    return expect(
      couch.ensureExistsOrCreateEntry('A', 'a@a.com', { throwIfExists: true }),
    ).rejects.toThrow(/entry already exists/);
  });

  test('insertEntry should fail', () => {
    return expect(
      couch.insertEntry({ $id: 'A', $content: {} }, 'a@a.com'),
    ).rejects.toThrow(/entry already exists/);
  });
});
