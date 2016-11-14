'use strict';

const data = require('./data/data');

describe('entries with attachments', function () {
    before(data);

    it('should error if entry has no attachment', function () {
        return couch.getAttachmentByUuidAndName('anonymousEntry', 'foo.txt', 'b@b.com')
            .should.be.rejectedWith(/attachment foo\.txt not found/);
    });

    it('should error if entry attachment does not exist', function () {
        return couch.getAttachmentByUuidAndName('entryWithAttachment', 'foo.txt', 'b@b.com')
            .should.be.rejectedWith(/attachment foo\.txt not found/);
    });

    it('should return attachment data', function () {
        return couch.getAttachmentByUuidAndName('entryWithAttachment', 'test.txt', 'b@b.com')
            .should.be.fulfilledWith(new Buffer('THIS IS A TEST'));
    });

    it('should delete an attachment from a document given by its uuid', function () {
        return couch.getEntryByUuid('entryWithAttachment', 'b@b.com')
            .then(entry => couch.deleteAttachmentByUuid(entry._id, 'b@b.com', 'test.txt', {
                rev: entry._rev
            }))
            .then(() => {
                return couch.getAttachmentByUuidAndName('entryWithAttachment', 'test.txt', 'b@b.com')
                    .should.be.rejectedWith(/attachment test\.txt not found/);
            });
    });
});
