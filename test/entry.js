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

    // todo allow to personalize default rights
    it.skip('should not grant read access to inexistant user', function () {
        return couch.getEntryById('A', 'z@z.com').then(doc => {
            (doc === null).should.be.true();
        });
    });

    it.skip('should not grant read access to non-owner non-read-group member', function () {
        return couch.getEntryById('A', 'z@z.com').then(doc => {
            (doc === null).should.be.true();
        });
    });
});

describe('entry writes', function () {
    beforeEach(data);

    it('should modify an entry', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            doc.abc = 'abc';
            return couch.insertEntry(doc, 'a@a.com');
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
        return couch.addGroupToEntry('A', 'a@a.com', 'groupC').should.be.rejected();
    });

    it('should remove group from entry', function () {
        return couch.removeGroupFromEntry('A', 'b@b.com', 'groupB')
            .then(() => couch.getEntryById('A', 'b@b.com'))
            .then(doc => {
                doc.$owners.indexOf('groupB').should.be.equal(-1);
            });
    });

    it('should fail to remove group from entry', function () {
        return couch.removeGroupFromEntry('A', 'a@a.com', 'groupB').should.be.rejected();
    });
});