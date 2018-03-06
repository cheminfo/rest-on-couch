'use strict';

const data = require('./data/data');

describe('entries with attachments', () => {
  beforeAll(data);

  test('should error if entry has no attachment', () => {
    return couch
      .getAttachmentByName('anonymousEntry', 'foo.txt', 'b@b.com')
      .should.be.rejectedWith(/attachment foo\.txt not found/);
  });

  test('should error if entry attachment does not exist', () => {
    return couch
      .getAttachmentByName('entryWithAttachment', 'foo.txt', 'b@b.com')
      .should.be.rejectedWith(/attachment foo\.txt not found/);
  });

  test('should return attachment data', () => {
    return couch
      .getAttachmentByName('entryWithAttachment', 'test.txt', 'b@b.com')
      .should.be.fulfilledWith(Buffer.from('THIS IS A TEST'));
  });

  test(
    'should delete an attachment from a document given by its uuid',
    () => {
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
    }
  );
});
