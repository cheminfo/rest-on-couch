import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';

import entryUnicity from '../data/byOwnerEntryUnicity.js';

describe('byOwner entry unicity', () => {
  beforeEach(entryUnicity);
  it('getEntryById should return the entry when user is the primary owner', async () => {
    const entry = await couch.getEntryById('Y', 'b@b.com');
    expect(entry.$id).toBe('Y');
  });

  it('getEntryById should fail when user is not the primary owner', async () => {
    return expect(couch.getEntryById('Y', 'a@a.com')).rejects.toThrow(
      /document not found/,
    );
  });

  it('ensureExistsOrCreateEntry should fail for user b@b.com because the id is already used by that user', () => {
    return expect(
      couch.ensureExistsOrCreateEntry('Y', 'b@b.com', { throwIfExists: true }),
    ).rejects.toThrow(/entry already exists/);
  });

  it('ensureExistsOrCreateEntry should not create a new entry for user b@b.com because primary owner is the same', async () => {
    const info = await couch.ensureExistsOrCreateEntry('Y', 'b@b.com');
    expect(info.isNew).toBe(false);
  });

  it('insertEntry should fail because b@b.com already has an entry with the same id', () => {
    return expect(
      couch.insertEntry({ $id: 'Y', $content: {} }, 'b@b.com'),
    ).rejects.toThrow(/entry already exists/);
  });

  it('insertEntry should also fail if user is authenticated with a token', async () => {
    const token = await couch.createUserToken('b@b.com', [
      'read',
      'write',
      'create',
    ]);
    return expect(
      couch.insertEntry({ $id: 'Y', $content: {} }, 'anonymous', {
        token,
      }),
    ).rejects.toThrow(/entry already exists/);
  });

  it('ensureExistsOrCreateEntry should create a new entry for user a@a.com because primary owner is different', async () => {
    const info = await couch.ensureExistsOrCreateEntry('Y', 'a@a.com');
    expect(info.isNew).toBe(true);
  });

  it('insertEntry should succeed when the id exists for another user', async () => {
    const newEntry = await couch.insertEntry(
      { $id: 'X', $content: {} },
      'b@b.com',
    );
    expect(newEntry.action).toBe('created');
    expect(newEntry.info.isNew).toBe(true);
  });
});
