'use strict';

const data = require('./data/data');

describe('entries with attachments', function () {
  before(data);

  it('should error if entry has no attachment', function () {
    return couch
      .getAttachmentByName('anonymousEntry', 'foo.txt', 'b@b.com')
      .should.be.rejectedWith(/attachment foo\.txt not found/);
  });

  it('should error if entry attachment does not exist', function () {
    return couch
      .getAttachmentByName('entryWithAttachment', 'foo.txt', 'b@b.com')
      .should.be.rejectedWith(/attachment foo\.txt not found/);
  });

  it('should return attachment data', function () {
    return couch
      .getAttachmentByName('entryWithAttachment', 'test.txt', 'b@b.com')
      .should.be.fulfilledWith(new Buffer('THIS IS A TEST'));
  });

  it('should delete an attachment from a document given by its uuid', function () {
    return couch
      .getEntry('entryWithAttachment', 'b@b.com')
      .then((entry) =>
        couch.deleteAttachment(entry._id, 'b@b.com', 'test.txt', {
          rev: entry._rev
        })
      )
      .then(() => {
        return couch
          .getAttachmentByName('entryWithAttachment', 'test.txt', 'b@b.com')
          .should.be.rejectedWith(/attachment test\.txt not found/);
      });
  });
});
