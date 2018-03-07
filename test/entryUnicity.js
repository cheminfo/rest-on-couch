'use strict';

const entryUnicity = require('./data/entryUnicity');

describe('global entry unicity', () => {
  beforeEach(entryUnicity);
  test('createEntry should fail', () => {
    return expect(couch
      .createEntry('A', 'a@a.com', { throwIfExists: true })).rejects.toThrow(/entry already exists/);
  });

  test('insertEntry should fail', () => {
    return expect(couch
      .insertEntry({ $id: 'A', $content: {} }, 'a@a.com')).rejects.toThrow(/entry already exists/);
  });
});
