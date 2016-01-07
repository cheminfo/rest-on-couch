'use strict';

const data = require('./data/data');

describe('entries with attachments', function () {
    before(data);

    it('should error if entry has no attachment', function () {
        return couch.getAttachmentByIdAndName('anonymousEntry', 'foo.txt', 'b@b.com')
            .should.be.rejectedWith(/attachment foo\.txt not found/);
    });

    it('should error if entry attachment does not exist', function () {
        return couch.getAttachmentByIdAndName('entryWithAttachment', 'foo.txt', 'b@b.com')
            .should.be.rejectedWith(/attachment foo\.txt not found/);
    });

    it('should return attachment data from id', function () {
        return couch.getAttachmentByIdAndName('entryWithAttachment', 'test.txt', 'b@b.com')
            .should.be.fulfilledWith(new Buffer('THIS IS A TEST'));
    });

    it('should return attachment data from uuid', function () {
        return couch.getEntryById('entryWithAttachment', 'b@b.com')
            .then(entry => couch.getAttachmentByUuidAndName(entry._id, 'test.txt', 'b@b.com'))
            .should.be.fulfilledWith(new Buffer('THIS IS A TEST'));
    });
});
