'use strict';

const data = require('./data/data');

describe('entries with attachments', () => {
  beforeAll(data);

  test('should error if entry has no attachment', () => {
    return expect(
      couch.getAttachmentByName('anonymousEntry', 'foo.txt', 'b@b.com')
    ).rejects.toThrow(/attachment foo\.txt not found/);
  });

  test('should error if entry attachment does not exist', () => {
    return expect(
      couch.getAttachmentByName('entryWithAttachment', 'foo.txt', 'b@b.com')
    ).rejects.toThrow(/attachment foo\.txt not found/);
  });

  test('should return attachment data', () => {
    return expect(
      couch.getAttachmentByName('entryWithAttachment', 'test.txt', 'b@b.com')
    ).resolves.toEqual(Buffer.from('THIS IS A TEST'));
  });

  test('should delete an attachment from a document given by its uuid', () => {
    return couch
      .getEntry('entryWithAttachment', 'b@b.com')
      .then((entry) =>
        couch.deleteAttachment(entry._id, 'b@b.com', 'test.txt', {
          rev: entry._rev
        })
      )
      .then(() => {
        return expect(
          couch.getAttachmentByName(
            'entryWithAttachment',
            'test.txt',
            'b@b.com'
          )
        ).rejects.toThrow(/attachment test\.txt not found/);
      });
  });
});
