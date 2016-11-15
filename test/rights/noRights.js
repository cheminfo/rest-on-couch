'use strict';

const data = require('../data/noRights');
const constants = require('../data/constants');

describe('entry reads, database without any default rights', function () {
    before(data);

    it('should grant read access to group member with read access', function () {
        return couch.getEntry('A', 'a@a.com').should.eventually.be.an.instanceOf(Object);
    });

    it('should not grant read access to inexistant user', function () {
        return couch.getEntry('A', 'z@z.com').should.be.rejectedWith(/no access/);
    });

    it('owner of entry should have access to it', function () {
        return couch.getEntry('A', 'b@b.com').should.eventually.be.an.instanceOf(Object);
    });

    it('non-read member should not have access to entry', function () {
        return couch.getEntry('A', 'c@c.com').should.be.rejectedWith(/no access/);
    });

    it('non-read member should not have access to entry (by uuid)', function () {
        return couch.getEntry('A', 'c@c.com').should.be.rejectedWith(/no access/);
    });

    it('should only get entries for which user has read access', function () {
        return couch.getEntriesByUserAndRights('a@a.com', 'read').then(entries => {
            entries.should.have.length(5);
            entries[0].$id.should.equal('A');
        });
    });

    it('should reject anonymous user', function () {
        return couch.getEntry('A', 'anonymous').should.be.rejectedWith(/no access/);
    });
});

describe('entry editions, database without any default rights', function () {
    before(data);

    it('any user is not allowed to create entry', function () {
        return couch.insertEntry(constants.newEntry, 'z@z.com').should.be.rejectedWith(/not allowed to create/);
    });
});
