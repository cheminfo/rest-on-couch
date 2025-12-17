import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import data from '../data/data.js';

describe('entries with attachments', () => {
  beforeEach(data);

  it('should error if entry has no attachment', () => {
    return expect(
      couch.getAttachmentByName('anonymousEntry', 'foo.txt', 'b@b.com'),
    ).rejects.toThrow(/attachment foo\.txt not found/);
  });

  it('should error if entry attachment does not exist', () => {
    return expect(
      couch.getAttachmentByName('entryWithAttachment', 'foo.txt', 'b@b.com'),
    ).rejects.toThrow(/attachment foo\.txt not found/);
  });

  it('should return attachment data', () => {
    return expect(
      couch.getAttachmentByName('entryWithAttachment', 'test.txt', 'b@b.com'),
    ).resolves.toEqual(Buffer.from('THIS IS A TEST'));
  });

  it('should delete an attachment from a document given by its uuid', () => {
    return couch
      .getEntry('entryWithAttachment', 'b@b.com')
      .then((entry) =>
        couch.deleteAttachment(entry._id, 'b@b.com', 'test.txt', {
          rev: entry._rev,
        }),
      )
      .then(() => {
        return expect(
          couch.getAttachmentByName(
            'entryWithAttachment',
            'test.txt',
            'b@b.com',
          ),
        ).rejects.toThrow(/attachment test\.txt not found/);
      });
  });
});
