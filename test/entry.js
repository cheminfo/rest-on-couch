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

    it('should not grant read access to owner', function () {
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
            })
        }) ;
    });

    it('should not find document', function () {
        return couch.getEntryByUuid('inexistant', 'b@b.com').should.be.rejectedWith(/not found/);
    });

    it('should get all readable entries for a user', function () {
        return couch.getEntriesByUserAndRights('b@b.com', 'read').then(entries => {
            entries.should.have.length(2);
        })
    });
});

describe('entry editons', function () {
    beforeEach(data);

    it('anonymous cannot insert a new entry', function () {
        return couch.insertEntry(constants.newEntry, 'anonymous').should.be.rejectedWith(/must be an email/);
    });

    it('entry should have content', function () {
        return couch.insertEntry({
            $id: 'D'
        }, 'z@z.com').should.be.rejectedWith(/has no content/);
    });

    it('anybody not anonymous can insert a new entry (without _id)', function () {
        return couch.insertEntry(constants.newEntry, 'z@z.com').then(() => {
            return couch.getEntryById('C', 'z@z.com').should.be.fulfilled();
        });
    });

    it('anybody not anonymous can insert a new entry (with _id)', function () {
        return couch.insertEntry(constants.newEntryWithId, 'z@z.com').then(() => {
            return couch.getEntryById('D', 'z@z.com').should.eventually.be.an.instanceOf(Object);
        })
    });

    it('should throw a conflict error', function () {
        return couch.getEntryById('A', 'b@b.com').then(doc => {
            return couch.insertEntry(doc, 'b@b.com').then(() => {
                return couch.insertEntry(doc, 'b@b.com').should.be.rejectedWith(/_rev differ/);
            });
        })
    });

    it('should modify an entry', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            doc.$content.abc = 'abc';
            return couch.insertEntry(doc, 'a@a.com').then(() => {
                return couch.getEntryById('A', 'a@a.com').then(entry => {
                    entry.$content.abc.should.equal('abc');
                })
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
});