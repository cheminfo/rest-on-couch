'use strict';

const data = require('./data/noRights');

describe('entry reads, database without any default rights', function () {
    before(data);

    it('should grant read access to group member with read access', function () {
        return couch.getEntryById('A', 'a@a.com').should.eventually.be.an.instanceOf(Object);
    });

    it('should not grant read access to inexistant user', function () {
        return couch.getEntryById('A', 'z@z.com').should.be.rejectedWith(/no access/);
    });

    it('owner of entry should have access to it', function () {
        return couch.getEntryById('A', 'b@b.com').should.eventually.be.an.instanceOf(Object);
    });

    it('non-read member should not have access to entry', function () {
        return couch.getEntryById('A', 'c@c.com').should.be.rejectedWith(/no access/);
    });

    it('non-read member should not have access to entry (by uuid)', function () {
        return couch.getEntryById('A', 'b@b.com').then(doc => {
            return couch.getEntryByUuid(doc._id, 'c@c.com').should.be.rejectedWith(/no access/);
        });
    });
});