import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import constants from '../data/constants.js';
import data from '../data/data.js';
import testUtils from '../utils/testUtils.js';

describe('entry reads', () => {
  beforeEach(data);
  it('should grant read access to read-group member', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('should grant read access to owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('getEntryById should work for owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('should grant read access to entry with anonymous read', () => {
    return couch.getEntry('anonymousEntry', 'anonymous').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('should get entry by uuid', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  it('should not find document', () => {
    return expect(couch.getEntry('inexistant', 'b@b.com')).rejects.toThrow(
      /not found/,
    );
  });

  it('should get all readable entries for a user', () => {
    return couch
      .getEntriesByUserAndRights('b@b.com', 'read')
      .then((entries) => {
        expect(entries).toHaveLength(6);
      });
  });
});

describe('entry creation and editions', () => {
  beforeEach(data);

  it('create a new entry', () => {
    return couch
      .ensureExistsOrCreateEntry('myid', 'a@a.com', {})
      .then((entryInfo) => {
        expect(entryInfo).toHaveProperty('id');
        expect(entryInfo).toHaveProperty('rev');
        return couch.getEntryById('myid', 'a@a.com').then((entry) => {
          expect(entry).toHaveProperty('$content');
        });
      });
  });

  it('create two entries with same id but different users', () => {
    return couch
      .ensureExistsOrCreateEntry('myid', 'a@a.com')
      .then((entryInfo) => {
        return couch
          .ensureExistsOrCreateEntry('myid', 'b@b.com')
          .then((entryInfo2) => {
            expect(entryInfo.id).not.toBe(entryInfo2.id);
          });
      });
  });

  it('create an entry for which the owner and id already exists', () => {
    return couch
      .ensureExistsOrCreateEntry('myid', 'a@a.com')
      .then((entryInfo) => {
        return couch
          .ensureExistsOrCreateEntry('myid', 'a@a.com')
          .then((entryInfo2) => {
            expect(entryInfo.id).toBe(entryInfo2.id);
          });
      });
  });

  it('anonymous cannot insert a new entry', () => {
    return expect(
      couch.insertEntry(constants.newEntry, 'anonymous'),
    ).rejects.toThrow(/anonymous not allowed to create/);
  });

  it('entry should have content', () => {
    return expect(
      couch.insertEntry(
        {
          $id: 'D',
        },
        'z@z.com',
      ),
    ).rejects.toThrow(/has no content/);
  });

  it('update entry should reject if entry does not exist', () => {
    return expect(
      couch.insertEntry(
        {
          _id: 'new',
          $content: {},
        },
        'z@z.com',
        { isUpdate: true },
      ),
    ).rejects.toThrow(/does not exist/);
  });

  it('update entry without _id nor $id should reject', () => {
    return expect(
      couch.insertEntry(
        {
          $content: {},
        },
        'z@z.com',
        { isUpdate: true },
      ),
    ).rejects.toThrow(/should have an _id/);
  });

  it('update entry without _id should reject', () => {
    return expect(
      couch.insertEntry(
        {
          $id: 'doc',
          $content: {},
        },
        'z@z.com',
        { isUpdate: true },
      ),
    ).rejects.toThrow(/Document must have an _id to be updated/);
  });

  it('create new entry that has an _id is not possible', () => {
    return expect(
      couch.insertEntry(
        {
          $content: {},
          _id: 'new',
        },
        'z@z.com',
        { isNew: true },
      ),
    ).rejects.toThrow(/should not have _id/);
  });

  it('anybody not anonymous can insert a new entry (without _id)', () => {
    return couch.insertEntry(constants.newEntry, 'z@z.com').then((res) => {
      expect(res.action).toBe('created');
      expect(res.info.id).toMatch(testUtils.uuidReg);
      expect(res.info.rev).toMatch(testUtils.revReg);
      return expect(
        couch.getEntryById(constants.newEntry.$id, 'z@z.com'),
      ).resolves.toBeDefined();
    });
  });

  it('anybody not anonymous can insert a new entry (with _id)', () => {
    return couch.insertEntry(constants.newEntryWithId, 'z@z.com').then(() => {
      return expect(couch.getEntryById('D', 'z@z.com')).resolves.toBeDefined();
    });
  });

  it('insert new entry with groups', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['groupX', 'groupY'],
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        expect(entry.$owners).toHaveLength(3);
      });
  });

  it('should dedupe owners when new entry is created', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['groupF', 'groupF'],
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        expect(entry.$owners).toHaveLength(2);
        expect(
          entry.$owners.reduce(
            (prev, current) => prev + (current === 'groupF' ? 1 : 0),
            0,
          ),
        ).toBe(1);
      });
  });

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

  it('should dedupe primary owner when new entry is created', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['z@z.com'],
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        expect(entry.$owners).toHaveLength(1);
      });
  });

  it('should throw a conflict error', () => {
    return couch.getEntryById('A', 'b@b.com').then((doc) => {
      return couch.insertEntry(doc, 'b@b.com').then(() => {
        return expect(couch.insertEntry(doc, 'b@b.com')).rejects.toThrow(
          /_rev differ/,
        );
      });
    });
  });

  it('should modify an entry', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      doc.$content.abc = 'abc';
      return couch.insertEntry(doc, 'a@a.com').then(() => {
        return couch.getEntry('A', 'a@a.com').then((entry) => {
          expect(entry.$content.abc).toBe('abc');
        });
      });
    });
  });

  it('should delete an entry by uuid', () => {
    return couch.deleteEntry('A', 'a@a.com').then(() => {
      return expect(couch.getEntry('A', 'a@a.com')).rejects.toThrow(
        /not found/,
      );
    });
  });

  it('should add owner to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'groupD', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupD')).toBeGreaterThan(0);
      });
  });

  it('should add multiple owners to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', ['groupD', 'groupE'], 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupD')).toBeGreaterThan(0);
        expect(doc.$owners.indexOf('groupE')).toBeGreaterThan(0);
      });
  });

  it('should dedupe added owners', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', ['groupD', 'groupD'], 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(
          doc.$owners.reduce(
            (prev, current) => prev + (current === 'groupD' ? 1 : 0),
            0,
          ),
        ).toBe(1);
      });
  });

  it('Add existing group to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'groupD', 'entry')
      .then(() => couch.addOwnersToDoc('A', 'b@b.com', 'groupD', 'entry'))
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((entry) => {
        let count = 0;
        for (let i = 0; i < entry.$owners.length; i++) {
          if (entry.$owners[i] === 'groupD') count++;
        }
        expect(count).toBe(1);
      });
  });

  it('Add existing group to entry (2)', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'anonymousRead', 'entry')
      .then(() =>
        couch.addOwnersToDoc('A', 'b@b.com', 'anonymousRead', 'entry'),
      )
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((entry) => {
        let count = 0;
        for (let i = 0; i < entry.$owners.length; i++) {
          if (entry.$owners[i] === 'anonymousRead') count++;
        }
        expect(count).toBe(1);
      });
  });

  it('should fail to add group to entry', () => {
    return expect(
      couch.addOwnersToDoc('A', 'a@a.com', 'groupC', 'entry'),
    ).rejects.toThrow(/user has no access/);
  });

  it('should remove group from entry', () => {
    return couch
      .removeOwnersFromDoc('A', 'b@b.com', 'groupB', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupB')).toBe(-1);
      });
  });

  it('should fail to remove group from entry', () => {
    return expect(
      couch.removeOwnersFromDoc('A', 'a@a.com', 'groupB', 'entry'),
    ).rejects.toThrow(/user has no access/);
  });

  it('should fail to remove primary owner', () => {
    return expect(
      couch.removeOwnersFromDoc('A', 'b@b.com', 'b@b.com', 'entry'),
    ).rejects.toThrow(/cannot remove primary owner/);
  });

  it('concurrent creation of the same entry should fail for one of them', async () => {
    const values = await Promise.allSettled([
      couch.insertEntry(constants.newEntry, 'a@a.com'),
      couch.insertEntry(constants.newEntry, 'a@a.com'),
      couch.insertEntry(constants.newEntry, 'a@a.com'),
    ]);
    const fulfilled = values.filter(({ status }) => status === 'fulfilled');
    const rejected = values.filter(({ status }) => status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    expect(rejected.map(({ reason }) => reason.message)).toStrictEqual([
      'entry already exists',
      'entry already exists',
    ]);
  });

  it('multiple entries with an $id of null can be created by the same user', async () => {
    const entry1 = await couch.insertEntry(
      { $id: null, $content: 'A' },
      'a@a.com',
    );
    const entry2 = await couch.insertEntry(
      { $id: null, $content: 'B' },
      'a@a.com',
    );

    const entry3 = await couch.insertEntry({ $content: 'C' }, 'a@a.com');

    expect(entry1.action).toBe('created');
    expect(entry2.action).toBe('created');
    expect(entry3.action).toBe('created');

    await expect(() => couch.getEntryById(null, 'a@a.com')).rejects.toThrow(
      /id must be defined in getEntryById/,
    );
    await expect(() =>
      couch.getEntryById(undefined, 'a@a.com'),
    ).rejects.toThrow(/id must be defined in getEntryById/);
  });

  it('$id is null by default', async () => {
    const entry = await couch.insertEntry({ $content: 'A' }, 'a@a.com');
    expect(entry.action).toEqual('created');

    const dbEntry = await couch.getEntry(entry.info.id, 'a@a.com');
    expect(dbEntry.$id).toBe(null);
    expect(dbEntry.$content).toBe('A');
  });
});

describe('entry rights', () => {
  beforeEach(data);
  it('should check if user a@a.com has read access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'read')).resolves.toBe(true));
  it('should check if user a@a.com has write access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'write')).resolves.toBe(
      true,
    ));
  it('should check if user a@a.com has delete access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'delete')).resolves.toBe(
      true,
    ));
  it('should reject when entry does not exist', () =>
    expect(
      couch.hasRightForEntry('does_not_exist', 'a@a.com', 'read'),
    ).rejects.toThrow(/not found/));
  // Global rights grant read and addAttachment rights
  it('should check if user b@b.com has read access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'read')).resolves.toBe(true));
  it('should check if user b@b.com has addAttachment access to entry', () =>
    expect(
      couch.hasRightForEntry('B', 'b@b.com', 'addAttachment'),
    ).resolves.toBe(true));
  it('should check if user b@b.com has write access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'write')).resolves.toBe(
      false,
    ));
  it('should check if user b@b.com has delete access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'delete')).resolves.toBe(
      false,
    ));
});
