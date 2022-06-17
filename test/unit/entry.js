'use strict';

const constants = require('../data/constants');
const data = require('../data/data');
const testUtils = require('../utils/testUtils');

describe('entry reads', () => {
  beforeEach(data);
  test('should grant read access to read-group member', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('should grant read access to owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('getEntryById should work for owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('should grant read access to entry with anonymous read', () => {
    return couch.getEntry('anonymousEntry', 'anonymous').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('should get entry by uuid', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      expect(doc).toBeInstanceOf(Object);
    });
  });

  test('should not find document', () => {
    return expect(couch.getEntry('inexistant', 'b@b.com')).rejects.toThrow(
      /not found/,
    );
  });

  test('should get all readable entries for a user', () => {
    return couch
      .getEntriesByUserAndRights('b@b.com', 'read')
      .then((entries) => {
        expect(entries).toHaveLength(6);
      });
  });
});

describe('entry creation and editions', () => {
  beforeEach(data);

  test('create a new entry', () => {
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

  test('create two entries with same id but different users', () => {
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

  test('create an entry for which the owner and id already exists', () => {
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

  test('anonymous cannot insert a new entry', () => {
    return expect(
      couch.insertEntry(constants.newEntry, 'anonymous'),
    ).rejects.toThrow(/anonymous not allowed to create/);
  });

  test('entry should have content', () => {
    return expect(
      couch.insertEntry(
        {
          $id: 'D',
        },
        'z@z.com',
      ),
    ).rejects.toThrow(/has no content/);
  });

  test('update entry should reject if entry does not exist', () => {
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

  test('update entry without _id nor $id should reject', () => {
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

  test('update entry without _id should reject', () => {
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

  test('create new entry that has an _id is not possible', () => {
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

  test('anybody not anonymous can insert a new entry (without _id)', () => {
    return couch.insertEntry(constants.newEntry, 'z@z.com').then((res) => {
      expect(res.action).toBe('created');
      expect(res.info.id).toMatch(testUtils.uuidReg);
      expect(res.info.rev).toMatch(testUtils.revReg);
      return expect(
        couch.getEntryById(constants.newEntry.$id, 'z@z.com'),
      ).resolves.toBeDefined();
    });
  });

  test('anybody not anonymous can insert a new entry (with _id)', () => {
    return couch.insertEntry(constants.newEntryWithId, 'z@z.com').then(() => {
      return expect(couch.getEntryById('D', 'z@z.com')).resolves.toBeDefined();
    });
  });

  test('insert new entry with groups', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['groupX', 'groupY'],
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        expect(entry.$owners).toHaveLength(3);
      });
  });

  test('should dedupe owners when new entry is created', () => {
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

  test('should dedupe primary owner when new entry is created', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['z@z.com'],
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        expect(entry.$owners).toHaveLength(1);
      });
  });

  test('should throw a conflict error', () => {
    return couch.getEntryById('A', 'b@b.com').then((doc) => {
      return couch.insertEntry(doc, 'b@b.com').then(() => {
        return expect(couch.insertEntry(doc, 'b@b.com')).rejects.toThrow(
          /_rev differ/,
        );
      });
    });
  });

  test('should modify an entry', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      doc.$content.abc = 'abc';
      return couch.insertEntry(doc, 'a@a.com').then(() => {
        return couch.getEntry('A', 'a@a.com').then((entry) => {
          expect(entry.$content.abc).toBe('abc');
        });
      });
    });
  });

  test('should delete an entry by uuid', () => {
    return couch.deleteEntry('A', 'a@a.com').then(() => {
      return expect(couch.getEntry('A', 'a@a.com')).rejects.toThrow(
        /not found/,
      );
    });
  });

  test('should add owner to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'groupD', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupD')).toBeGreaterThan(0);
      });
  });

  test('should add multiple owners to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', ['groupD', 'groupE'], 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupD')).toBeGreaterThan(0);
        expect(doc.$owners.indexOf('groupE')).toBeGreaterThan(0);
      });
  });

  test('should dedupe added owners', () => {
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

  test('Add existing group to entry', () => {
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

  test('Add existing group to entry (2)', () => {
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

  test('should fail to add group to entry', () => {
    return expect(
      couch.addOwnersToDoc('A', 'a@a.com', 'groupC', 'entry'),
    ).rejects.toThrow(/user has no access/);
  });

  test('should remove group from entry', () => {
    return couch
      .removeOwnersFromDoc('A', 'b@b.com', 'groupB', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        expect(doc.$owners.indexOf('groupB')).toBe(-1);
      });
  });

  test('should fail to remove group from entry', () => {
    return expect(
      couch.removeOwnersFromDoc('A', 'a@a.com', 'groupB', 'entry'),
    ).rejects.toThrow(/user has no access/);
  });

  test('should fail to remove primary owner', () => {
    return expect(
      couch.removeOwnersFromDoc('A', 'b@b.com', 'b@b.com', 'entry'),
    ).rejects.toThrow(/cannot remove primary owner/);
  });

  test('concurrent creation of the same entry should fail for one of them', async () => {
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

  test('multiple entries with an $id of null can be created by the same user', async () => {
    const entry1 = await couch.insertEntry(
      { $id: null, $content: 'A' },
      'a@a.com',
    );
    const entry2 = await couch.insertEntry(
      { $id: null, $content: 'B' },
      'a@a.com',
    );

    expect(entry1.action).toBe('created');
    expect(entry2.action).toBe('created');
    expect(entry1.info.isNew).toBe(true);
    expect(entry2.info.isNew).toBe(true);
  });

  test('$id is null by default', async () => {
    const entry = await couch.insertEntry({ $content: 'A' }, 'a@a.com');
    expect(entry.action).toEqual('created');

    const dbEntry = await couch.getEntry(entry.info.id, 'a@a.com');
    expect(dbEntry.$id).toBe(null);
    expect(dbEntry.$content).toBe('A');
  });
});

describe('entry rights', () => {
  beforeEach(data);
  test('should check if user a@a.com has read access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'read')).resolves.toBe(true));
  test('should check if user a@a.com has write access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'write')).resolves.toBe(
      true,
    ));
  test('should check if user a@a.com has delete access to entry', () =>
    expect(couch.hasRightForEntry('A', 'a@a.com', 'delete')).resolves.toBe(
      true,
    ));
  test('should reject when entry does not exist', () =>
    expect(
      couch.hasRightForEntry('does_not_exist', 'a@a.com', 'read'),
    ).rejects.toThrow(/not found/));
  // Global rights grant read and addAttachment rights
  test('should check if user b@b.com has read access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'read')).resolves.toBe(true));
  test('should check if user b@b.com has addAttachment access to entry', () =>
    expect(
      couch.hasRightForEntry('B', 'b@b.com', 'addAttachment'),
    ).resolves.toBe(true));
  test('should check if user b@b.com has write access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'write')).resolves.toBe(
      false,
    ));
  test('should check if user b@b.com has delete access to entry', () =>
    expect(couch.hasRightForEntry('B', 'b@b.com', 'delete')).resolves.toBe(
      false,
    ));
});
