'use strict';

const data = require('../data/noRights');

describe('entry reads, database with default groups', function () {
    before(data);

    it('should grant read access to owner', function () {
        return couch.getEntryById('entryWithDefaultAnonymousRead', 'x@x.com').should.eventually.be.an.Object();
    });

    it('should grant read access to anonymous user', function () {
        return couch.getEntryById('entryWithDefaultAnonymousRead', 'anonymous').should.eventually.be.an.Object();
    });

    it('should grant read access to logged in user', function () {
        return couch.getEntryById('entryWithDefaultAnyuserRead', 'a@a.com').should.eventually.be.an.Object();
    });

    it('should not grant read access to anonymous user', function () {
        return couch.getEntryById('entryWithDefaultAnyuserRead', 'anonymous').should.be.rejectedWith(/no access/);
    });

    it('should grant read access to anonymous user (multiple groups)', function () {
        return couch.getEntryById('entryWithDefaultMultiRead', 'anonymous').should.eventually.be.an.Object();
    });
});
