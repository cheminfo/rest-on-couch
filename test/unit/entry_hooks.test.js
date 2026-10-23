import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';
import { getGlobalConfig } from '../../src/config/config.js';
import data from '../data/data.js';

describe('before create hook', () => {
  function beforeCreateHook(document, groups) {
    const owner = document.$owners[0];

    const groupsToAdd = groups.filter(
      (group) =>
        !document.$owners.some((owner) => owner === group.name) &&
        group.users.some((user) => user === owner),
    );
    for (let group of groupsToAdd) {
      document.$owners.push(group.name);
    }
  }

  const globalConfig = getGlobalConfig();
  globalConfig.beforeCreateHook = beforeCreateHook;

  beforeEach(data);

  it('insertEntry should modify entry with beforeCreateHook (a@a.com)', () => {
    return couch
      .insertEntry(
        {
          $id: 'beforeCreate1',
          $content: { test: true },
        },
        'a@a.com',
      )
      .then(() => couch.getEntryById('beforeCreate1', 'a@a.com'))
      .then((entry) => {
        // The groups were added by the hook
        expect(entry.$owners).toEqual(['a@a.com', 'groupA', 'groupB']);
      });
  });

  it('insertEntry should modify entry with beforeCreateHook (c@c.com)', () => {
    return couch
      .insertEntry(
        {
          $id: 'beforeCreate2',
          $content: { test: true },
        },
        'c@c.com',
      )
      .then(() => couch.getEntryById('beforeCreate2', 'c@c.com'))
      .then((entry) => {
        // The groups were added by the hook
        expect(entry.$owners).toEqual(['c@c.com', 'groupC']);
      });
  });

  it('ensureExistsOrCreateEntry should modify entry with beforeCreateHook (a@a.com)', () => {
    return couch
      .ensureExistsOrCreateEntry('beforeCreate3', 'a@a.com', {
        throwIfExists: true,
      })
      .then(() => couch.getEntryById('beforeCreate3', 'a@a.com'))
      .then((entry) => {
        // The groups were added by the hook
        expect(entry.$owners).toEqual(['a@a.com', 'groupA', 'groupB']);
      });
  });
});
