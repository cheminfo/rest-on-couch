'use strict';

const data = require('./data/data');

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
});

var newEntry = {
    $id: 'C',
    $content: {
        test: true
    }
};

describe('entry editons', function () {
    beforeEach(data);

    it('anonymous cannot insert a new entry', function () {
        return couch.insertEntry(newEntry, 'anonymous').should.be.rejectedWith(/must be an email/);
    });

    it('anybody not anonymous can insert a new entry', function () {
        return couch.insertEntry(newEntry, 'z@z.com').then(() => {
            return couch.getEntryById('C', 'z@z.com').should.be.fulfilled();
        });

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