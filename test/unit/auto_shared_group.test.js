import { afterEach, beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import { getGlobalConfig } from '../../src/config/config.js';
import data from '../data/data.js';
import insertDocument from '../data/insertDocument.js';

describe('auto-shared groups', () => {
  const globalConfig = getGlobalConfig();
  const fixtureHook = globalConfig.beforeCreateHook;
  let ownersSeenByHook;

  beforeEach(async () => {
    await data();
    await Promise.all([
      insertDocument(couch._db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'groupAuto',
        users: ['a@a.com', 'b@b.com'],
        customUsers: ['a@a.com', 'b@b.com'],
        rights: ['read'],
        autoShare: true,
      }),
      insertDocument(couch._db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'groupAuto2',
        users: ['b@b.com'],
        customUsers: ['b@b.com'],
        rights: ['read'],
        autoShare: true,
      }),
    ]);

    ownersSeenByHook = undefined;
    globalConfig.beforeCreateHook = (document) => {
      ownersSeenByHook = [...document.$owners];
    };
  });

  afterEach(() => {
    globalConfig.beforeCreateHook = fixtureHook;
  });

  it('adds only auto-shared groups the creator is a member of', async () => {
    await couch.insertEntry({ $id: 'auto1', $content: {} }, 'a@a.com');
    const entry = await couch.getEntryById('auto1', 'a@a.com');
    expect(entry.$owners).toEqual(['a@a.com', 'groupAuto']);
  });

  it('does not add any group when the creator is not a member', async () => {
    await couch.insertEntry({ $id: 'auto2', $content: {} }, 'c@c.com');
    const entry = await couch.getEntryById('auto2', 'c@c.com');
    expect(entry.$owners).toEqual(['c@c.com']);
  });

  it('adds auto-shared groups before calling beforeCreateHook', async () => {
    await couch.insertEntry({ $id: 'auto3', $content: {} }, 'b@b.com');
    expect(ownersSeenByHook).toEqual(['b@b.com', 'groupAuto', 'groupAuto2']);
  });

  it('adds auto-shared groups with ensureExistsOrCreateEntry', async () => {
    await couch.ensureExistsOrCreateEntry('auto5', 'a@a.com', {
      throwIfExists: true,
    });
    const entry = await couch.getEntryById('auto5', 'a@a.com');
    expect(entry.$owners).toEqual(['a@a.com', 'groupAuto']);
  });

  it('turning autoShare off only affects new entries', async () => {
    await couch.insertEntry({ $id: 'auto8', $content: {} }, 'a@a.com');
    await couch.setGroupProperties('groupAuto', 'a@a.com', {
      autoShare: false,
    });
    await couch.insertEntry({ $id: 'auto9', $content: {} }, 'a@a.com');

    const before = await couch.getEntryById('auto8', 'a@a.com');
    const after = await couch.getEntryById('auto9', 'a@a.com');
    expect(before.$owners).toEqual(['a@a.com', 'groupAuto']);
    expect(after.$owners).toEqual(['a@a.com']);
  });

  it('turning autoShare on applies to new entries', async () => {
    await couch.setGroupProperties('groupA', 'a@a.com', { autoShare: true });
    await couch.insertEntry({ $id: 'auto10', $content: {} }, 'a@a.com');
    const entry = await couch.getEntryById('auto10', 'a@a.com');
    expect(entry.$owners).toEqual(['a@a.com', 'groupA', 'groupAuto']);
  });

  it('setGroupProperties rejects when auto-share is not a boolean', () => {
    return expect(
      couch.setGroupProperties('groupA', 'a@a.com', { autoShare: 'yes' }),
    ).rejects.toThrow(/autoShare must be a boolean/);
  });

  it('cannot save a group when auto-share is not a boolean', () => {
    return expect(
      insertDocument(couch._db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'groupInvalid',
        users: [],
        customUsers: [],
        rights: [],
        autoShare: 'yes',
      }),
    ).rejects.toThrow(/autoShare must be a boolean/);
  });

  it('getGroupInfo exposes autoShare to members', async () => {
    const autoInfo = await couch.getGroupInfo('groupAuto', 'b@b.com');
    expect(autoInfo.autoShare).toBe(true);
    const otherInfo = await couch.getGroupInfo('groupA', 'a@a.com');
    expect(otherInfo.autoShare).toBe(false);
  });

  it('getGroupInfo does not expose autoShare to non-members', async () => {
    const info = await couch.getGroupInfo('groupAuto', 'c@c.com');
    expect(info).not.toHaveProperty('autoShare');
  });
});
