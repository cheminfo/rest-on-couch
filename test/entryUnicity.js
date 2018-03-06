'use strict';

const entryUnicity = require('./data/entryUnicity');

describe('global entry unicity', () => {
  beforeEach(entryUnicity);
  test('createEntry should fail', () => {
    return couch
      .createEntry('A', 'a@a.com', { throwIfExists: true })
      .should.be.rejectedWith(/entry already exists/);
  });

  test('insertEntry should fail', () => {
    return couch
      .insertEntry({ $id: 'A', $content: {} }, 'a@a.com')
      .should.be.rejectedWith(/entry already exists/);
  });
});
