import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import constants from '../data/constants.js';
import data from '../data/data.js';

describe('token methods data', () => {
  beforeEach(data);

  it('user token allow to create document', async () => {
    const token = await couch.createUserToken('a@a.com', [
      'read',
      'write',
      'create',
    ]);
    const newEntry = await couch.insertEntry(constants.newEntry, 'anonymous', {
      token,
    });
    expect(newEntry.action).toBe('created');
    expect(newEntry.info.isNew).toBe(true);
  });

  it('user token should not allow to create document with groups if not owner', async () => {
    const token = await couch.createUserToken('a@a.com', ['read', 'create']);
    await expect(
      couch.insertEntry(constants.newEntry, 'anonymous', {
        token,
        groups: ['group1'],
      }),
    ).rejects.toThrow(/not allowed to create with groups/);
  });

  it('user token allow to create document with groups if owner', async () => {
    const token = await couch.createUserToken('a@a.com', [
      'read',
      'create',
      'owner',
    ]);
    const newEntry = await couch.insertEntry(constants.newEntry, 'anonymous', {
      token,
      groups: ['group1'],
    });
    expect(newEntry.action).toBe('created');
    expect(newEntry.info.isNew).toBe(true);
  });
});
