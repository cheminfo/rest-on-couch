'use strict';

const data = require('./data/data');
const constants = require('./data/constants');

describe('entry reads', () => {
  beforeAll(data);
  test('should grant read access to read-group member', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('should grant read access to owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('getEntryById should work for owner', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('should grant read access to entry with anonymous read', () => {
    return couch.getEntry('anonymousEntry', 'anonymous').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('should get entry by uuid', () => {
    return couch.getEntry('A', 'b@b.com').then((doc) => {
      doc.should.be.an.instanceOf(Object);
    });
  });

  test('should not find document', () => {
    return couch
      .getEntry('inexistant', 'b@b.com')
      .should.be.rejectedWith(/not found/);
  });

  test('should get all readable entries for a user', () => {
    return couch.getEntriesByUserAndRights('b@b.com', 'read').then((entries) => {
      entries.should.have.length(5);
    });
  });
});

describe('entry creation and editions', () => {
  beforeEach(data);

  test('create a new entry', () => {
    return couch.createEntry('myid', 'a@a.com', {}).then((entryInfo) => {
      entryInfo.should.have.property('id');
      entryInfo.should.have.property('rev');
      return couch.getEntryById('myid', 'a@a.com').then((entry) => {
        entry.should.have.property('$content');
      });
    });
  });

  test('create two entries with same id but different users', () => {
    return couch.createEntry('myid', 'a@a.com').then((entryInfo) => {
      return couch.createEntry('myid', 'b@b.com').then((entryInfo2) => {
        entryInfo.id.should.not.equal(entryInfo2.id);
      });
    });
  });

  test('create an entry for which the owner and id already exists', () => {
    return couch.createEntry('myid', 'a@a.com').then((entryInfo) => {
      return couch.createEntry('myid', 'a@a.com').then((entryInfo2) => {
        entryInfo.id.should.equal(entryInfo2.id);
      });
    });
  });

  test('anonymous cannot insert a new entry', () => {
    return couch
      .insertEntry(constants.newEntry, 'anonymous')
      .should.be.rejectedWith(/must be an email/);
  });

  test('entry should have content', () => {
    return couch
      .insertEntry(
        {
          $id: 'D'
        },
        'z@z.com'
      )
      .should.be.rejectedWith(/has no content/);
  });

  test('update entry should reject if entry does not exist', () => {
    return couch
      .insertEntry(
        {
          _id: 'new',
          $content: {}
        },
        'z@z.com',
        { isUpdate: true }
      )
      .should.be.rejectedWith(/does not exist/);
  });

  test('update entry without _id should reject', () => {
    return couch
      .insertEntry(
        {
          $content: {}
        },
        'z@z.com',
        { isUpdate: true }
      )
      .should.be.rejectedWith(/should have an _id/);
  });

  test('create new entry that has an _id is not possible', () => {
    return couch
      .insertEntry(
        {
          $content: {},
          _id: 'new'
        },
        'z@z.com',
        { isNew: true }
      )
      .should.be.rejectedWith(/should not have _id/);
  });

  test(
    'anybody not anonymous can insert a new entry (without _id)',
    () => {
      return couch.insertEntry(constants.newEntry, 'z@z.com').then((res) => {
        res.action.should.equal('created');
        res.info.id.should.be.an.instanceOf(String);
        res.info.rev.should.be.an.instanceOf(String);
        return couch
          .getEntryById(constants.newEntry.$id, 'z@z.com')
          .should.be.fulfilled();
      });
    }
  );

  test('anybody not anonymous can insert a new entry (with _id)', () => {
    return couch.insertEntry(constants.newEntryWithId, 'z@z.com').then(() => {
      return couch
        .getEntryById('D', 'z@z.com')
        .should.eventually.be.an.instanceOf(Object);
    });
  });

  test('insert new entry with groups', () => {
    return couch
      .insertEntry(constants.newEntry, 'z@z.com', {
        groups: ['groupX', 'groupY']
      })
      .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
      .then((entry) => {
        entry.$owners.should.have.length(3);
      });
  });

  test('should throw a conflict error', () => {
    return couch.getEntryById('A', 'b@b.com').then((doc) => {
      return couch.insertEntry(doc, 'b@b.com').then(() => {
        return couch
          .insertEntry(doc, 'b@b.com')
          .should.be.rejectedWith(/_rev differ/);
      });
    });
  });

  test('should modify an entry', () => {
    return couch.getEntry('A', 'a@a.com').then((doc) => {
      doc.$content.abc = 'abc';
      return couch.insertEntry(doc, 'a@a.com').then(() => {
        return couch.getEntry('A', 'a@a.com').then((entry) => {
          entry.$content.abc.should.equal('abc');
        });
      });
    });
  });

  test('should delete an entry by uuid', () => {
    return couch.deleteEntry('A', 'a@a.com').then(() => {
      return couch.getEntry('A', 'a@a.com').should.be.rejectedWith(/not found/);
    });
  });

  test('should add group to entry', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'groupD', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        doc.$owners.indexOf('groupD').should.be.above(0);
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
        count.should.equal(1);
      });
  });

  test('Add existing group to entry (2)', () => {
    return couch
      .addOwnersToDoc('A', 'b@b.com', 'anonymousRead', 'entry')
      .then(() =>
        couch.addOwnersToDoc('A', 'b@b.com', 'anonymousRead', 'entry')
      )
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((entry) => {
        let count = 0;
        for (let i = 0; i < entry.$owners.length; i++) {
          if (entry.$owners[i] === 'anonymousRead') count++;
        }
        count.should.equal(1);
      });
  });

  test('should fail to add group to entry', () => {
    return couch
      .addOwnersToDoc('A', 'a@a.com', 'groupC', 'entry')
      .should.be.rejectedWith(/user has no access/);
  });

  test('should remove group from entry', () => {
    return couch
      .removeOwnersFromDoc('A', 'b@b.com', 'groupB', 'entry')
      .then(() => couch.getEntry('A', 'b@b.com'))
      .then((doc) => {
        doc.$owners.indexOf('groupB').should.be.equal(-1);
      });
  });

  test('should fail to remove group from entry', () => {
    return couch
      .removeOwnersFromDoc('A', 'a@a.com', 'groupB', 'entry')
      .should.be.rejectedWith(/user has no access/);
  });

  test('should fail to remove primary owner', () => {
    return couch
      .removeOwnersFromDoc('A', 'b@b.com', 'b@b.com', 'entry')
      .should.be.rejectedWith(/cannot remove primary owner/);
  });
});

describe('entry rights', () => {
  beforeAll(data);
  test('should check if user a@a.com has read access to entry', () =>
    couch
      .hasRightForEntry('A', 'a@a.com', 'read')
      .should.eventually.be.equal(true));
  test('should check if user a@a.com has write access to entry', () =>
    couch
      .hasRightForEntry('A', 'a@a.com', 'write')
      .should.eventually.be.equal(true));
  test('should check if user a@a.com has delete access to entry', () =>
    couch
      .hasRightForEntry('A', 'a@a.com', 'delete')
      .should.eventually.be.equal(true));
  test('should reject when entry does not exist', () =>
    couch
      .hasRightForEntry('does_not_exist', 'a@a.com', 'read')
      .should.be.rejectedWith(/not found/));
  // Global rights grant read and addAttachment rights
  test('should check if user b@b.com has read access to entry', () =>
    couch
      .hasRightForEntry('B', 'b@b.com', 'read')
      .should.eventually.be.equal(true));
  test('should check if user b@b.com has addAttachment access to entry', () =>
    couch
      .hasRightForEntry('B', 'b@b.com', 'addAttachment')
      .should.eventually.be.equal(true));
  test('should check if user b@b.com has write access to entry', () =>
    couch
      .hasRightForEntry('B', 'b@b.com', 'write')
      .should.eventually.be.equal(false));
  test('should check if user b@b.com has delete access to entry', () =>
    couch
      .hasRightForEntry('B', 'b@b.com', 'delete')
      .should.eventually.be.equal(false));
});
