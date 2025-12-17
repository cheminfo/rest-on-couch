import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import entryUnicity from '../data/globalEntryUnicity.js';

describe('global entry unicity', () => {
  beforeEach(entryUnicity);
  it('getEntryById should return the entry when user is the primary owner', async () => {
    const entry = await couch.getEntryById('Y', 'b@b.com');
    expect(entry.$id).toBe('Y');
  });

  it('getEntryById should return the entry when user is owner via a group', async () => {
    const entry = await couch.getEntryById('Y', 'a@a.com');
    expect(entry.$id).toBe('Y');
  });

  it('ensureExistsOrCreateEntry should fail for user a@a.com because the id is already used by another user', () => {
    return expect(
      couch.ensureExistsOrCreateEntry('Y', 'a@a.com', { throwIfExists: true }),
    ).rejects.toThrow(/entry already exists/);
  });

  it('ensureExistsOrCreateEntry should not create a new entry for user b@b.com because the exists', async () => {
    const info = await couch.ensureExistsOrCreateEntry('Y', 'b@b.com');
    expect(info.isNew).toBe(false);
  });

  it('ensureExistsOrCreateEntry should not create a new entry for user a@a.com because the id exists', async () => {
    const info = await couch.ensureExistsOrCreateEntry('Y', 'a@a.com');
    expect(info.isNew).toBe(false);
  });

  it('insertEntry should fail with user b@b.com because there already is an entry with the same id', () => {
    return expect(
      couch.insertEntry({ $id: 'Y', $content: {} }, 'b@b.com'),
    ).rejects.toThrow(/entry already exists/);
  });

  it('insertEntry should fail with user a@a.com because there already is an entry with the same id', () => {
    return expect(
      couch.insertEntry({ $id: 'Y', $content: {} }, 'a@a.com'),
    ).rejects.toThrow(/entry already exists/);
  });
});
