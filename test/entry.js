'use strict';

const data = require('./data/data');
const constants = require('./data/constants');

describe('entry reads', function () {
    before(data);
    it('should grant read access to read-group member', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            doc.should.be.an.instanceOf(Object);
        });
    });

    it('should grant read access to owner', function () {
        return couch.getEntryById('A', 'b@b.com').then(doc => {
            doc.should.be.an.instanceOf(Object);
        });
    });

    it('should grant read access to entry with anonymous read', function () {
        return couch.getEntryById('anonymousEntry', 'anonymous').then(doc => {
            doc.should.be.an.instanceOf(Object);
        });
    });

    it('should get entry by uuid', function () {
        return couch.getEntryById('A', 'b@b.com').then(doc => {
            return couch.getEntryByUuid(doc._id, 'b@b.com').then(doc => {
                doc.should.be.an.instanceOf(Object);
            });
        });
    });

    it('should not find document', function () {
        return couch.getEntryByUuid('inexistant', 'b@b.com').should.be.rejectedWith(/not found/);
    });

    it('should get all readable entries for a user', function () {
        return couch.getEntriesByUserAndRights('b@b.com', 'read').then(entries => {
            entries.should.have.length(5);
        });
    });
});

describe('entry creation and editions', function () {
    beforeEach(data);

    it('create a new entry', function () {
        return couch.createEntry('myid', 'a@a.com', {}).then(entryInfo => {
            entryInfo.should.have.property('id');
            entryInfo.should.have.property('rev');
            return couch.getEntryById('myid', 'a@a.com').then(entry => {
                entry.should.have.property('$content');
            });
        });
    });

    it('create two entries with same id but different users', function () {
        return couch.createEntry('myid', 'a@a.com').then(entryInfo => {
            return couch.createEntry('myid', 'b@b.com').then(entryInfo2 => {
                entryInfo.id.should.not.equal(entryInfo2.id);
            });
        });
    });

    it('create an entry for which the owner and id already exists', function () {
        return couch.createEntry('myid', 'a@a.com').then(entryInfo => {
            return couch.createEntry('myid', 'a@a.com').then(entryInfo2 => {
                entryInfo.id.should.equal(entryInfo2.id);
            });
        });
    });

    it('anonymous cannot insert a new entry', function () {
        return couch.insertEntry(constants.newEntry, 'anonymous').should.be.rejectedWith(/must be an email/);
    });

    it('entry should have content', function () {
        return couch.insertEntry({
            $id: 'D'
        }, 'z@z.com').should.be.rejectedWith(/has no content/);
    });

    it('update entry should reject if entry does not exist', function () {
        return couch.insertEntry({
            _id: 'new',
            $content: {}
        }, 'z@z.com', {isUpdate: true}).should.be.rejectedWith(/does not exist/);
    });

    it('update entry without _id should reject', function () {
        return couch.insertEntry({
            $content: {}
        }, 'z@z.com', {isUpdate: true}).should.be.rejectedWith(/should have an _id/);
    });

    it('create new entry that has an _id is not possible', function () {
        return couch.insertEntry({
            $content: {},
            _id: 'new'
        }, 'z@z.com', {isNew: true}).should.be.rejectedWith(/should not have _id/);
    });

    it('anybody not anonymous can insert a new entry (without _id)', function () {
        return couch.insertEntry(constants.newEntry, 'z@z.com').then(res => {
            res.action.should.equal('created');
            res.info.id.should.be.an.instanceOf(String);
            res.info.rev.should.be.an.instanceOf(String);
            return couch.getEntryById('C', 'z@z.com').should.be.fulfilled();
        });
    });

    it('anybody not anonymous can insert a new entry (with _id)', function () {
        return couch.insertEntry(constants.newEntryWithId, 'z@z.com').then(() => {
            return couch.getEntryById('D', 'z@z.com').should.eventually.be.an.instanceOf(Object);
        });
    });

    it('insert new entry with groups', function () {
        return couch.insertEntry(constants.newEntry, 'z@z.com', {groups: ['groupX', 'groupY']})
            .then(() => couch.getEntryById(constants.newEntry.$id, 'z@z.com'))
            .then(entry => {
                entry.$owners.should.have.length(3);
            });
    });

    it('should throw a conflict error', function () {
        return couch.getEntryById('A', 'b@b.com').then(doc => {
            return couch.insertEntry(doc, 'b@b.com').then(() => {
                return couch.insertEntry(doc, 'b@b.com').should.be.rejectedWith(/_rev differ/);
            });
        });
    });

    it('should modify an entry', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            doc.$content.abc = 'abc';
            return couch.insertEntry(doc, 'a@a.com').then(() => {
                return couch.getEntryById('A', 'a@a.com').then(entry => {
                    entry.$content.abc.should.equal('abc');
                });
            });
        });
    });

    it('should delete an entry by uuid', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            return couch.deleteEntryByUuid(doc._id, 'a@a.com')
                .then(() => {
                    return couch.getEntryById('A', 'a@a.com').should.be.rejectedWith(/not found/);
                });
        });
    });

    it('should delete an entry by id', function () {
        return couch.deleteEntryById('A', 'a@a.com')
            .then(() => {
                return couch.getEntryById('A', 'a@a.com').should.be.rejectedWith(/not found/);
            });
    });

    it('should add group to entry', function () {
        return couch.addGroupToEntry('A', 'b@b.com', 'groupD')
            .then(() => couch.getEntryById('A', 'b@b.com'))
            .then(doc => {
                doc.$owners.indexOf('groupD').should.be.above(0);
            });
    });

    it('Add existing group to entry', function () {
        return couch.addGroupToEntry('A', 'b@b.com', 'groupD')
            .then(() => couch.addGroupToEntry('A', 'b@b.com', 'groupD'))
            .then(() => couch.getEntryById('A', 'b@b.com'))
            .then(entry => {
                let count = 0;
                for (let i = 0; i < entry.$owners.length; i++) {
                    if (entry.$owners[i] === 'groupD') count++;
                }
                count.should.equal(1);
            });
    });

    it('Add existing group to entry (by uuid)', function () {
        return couch.getEntryById('A', 'b@b.com')
            .then(entry => {
                let uuid = entry._id;
                return couch.addGroupToEntryByUuid(uuid, 'b@b.com', 'anonymousRead')
                    .then(() => couch.addGroupToEntryByUuid(uuid, 'b@b.com', 'anonymousRead'))
                    .then(() => couch.getEntryById('A', 'b@b.com'))
                    .then(entry => {
                        let count = 0;
                        for (let i = 0; i < entry.$owners.length; i++) {
                            if (entry.$owners[i] === 'anonymousRead') count++;
                        }
                        count.should.equal(1);
                    });
            });
    });

    it('should fail to add group to entry', function () {
        return couch.addGroupToEntry('A', 'a@a.com', 'groupC').should.be.rejectedWith(/unauthorized/);
    });

    it('should remove group from entry', function () {
        return couch.removeGroupFromEntry('A', 'b@b.com', 'groupB')
            .then(() => couch.getEntryById('A', 'b@b.com'))
            .then(doc => {
                doc.$owners.indexOf('groupB').should.be.equal(-1);
            });
    });

    it('should fail to remove group from entry', function () {
        return couch.removeGroupFromEntry('A', 'a@a.com', 'groupB').should.be.rejectedWith(/unauthorized/);
    });

    it('should fail to remove primary owner', function () {
        return couch.removeGroupFromEntry('A', 'b@b.com', 'b@b.com').should.be.rejectedWith(/cannot remove primary owner/);
    });
});

describe('entry rights', function () {
    before(data);
    it('should check if user a@a.com has read access to entry', () => couch.hasRightForEntry('A', 'a@a.com', 'read').should.eventually.be.equal(true));
    it('should check if user a@a.com has write access to entry', () => couch.hasRightForEntry('A', 'a@a.com', 'write').should.eventually.be.equal(true));
    it('should check if user a@a.com has delete access to entry', () => couch.hasRightForEntry('A', 'a@a.com', 'delete').should.eventually.be.equal(true));
    it('should reject when entry does not exist', () => couch.hasRightForEntry('does_not_exist', 'a@a.com', 'read').should.be.rejectedWith(/not found/));
    // Global rights grant read and addAttachment rights
    it('should check if user b@b.com has read access to entry', () => couch.hasRightForEntry('B', 'b@b.com', 'read').should.eventually.be.equal(true));
    it('should check if user b@b.com has read access to entry', () => couch.hasRightForEntry('B', 'b@b.com', 'addAttachment').should.eventually.be.equal(true));
    it('should check if user b@b.com has write access to entry', () => couch.hasRightForEntry('B', 'b@b.com', 'write').should.eventually.be.equal(false));
    it('should check if user b@b.com has delete access to entry', () => couch.hasRightForEntry('B', 'b@b.com', 'delete').should.eventually.be.equal(false));
});
