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

  it('_addFileToJpath keeps the previous attachment when another element of the jpath still references it', async () => {
    const user = 'b@b.com';
    const shared = 'jpath/shared.txt';
    const { info } = await couch.insertEntry(
      {
        $id: 'shared_attachment',
        $content: {
          jpath: [
            { reference: 'ref1', file: { filename: shared } },
            { reference: 'ref2', file: { filename: shared } },
          ],
        },
      },
      user,
    );
    await couch.addAttachments(info.id, user, {
      name: shared,
      data: Buffer.from('shared'),
      content_type: 'text/plain',
    });

    // ref1 moves to a new attachment, but ref2 still references the shared one
    await couch._addFileToJpath('shared_attachment', user, [
      {
        jpath: ['jpath'],
        reference: 'ref1',
        attachments: [
          {
            field: 'file',
            filename: 'jpath/first.txt',
            contents: Buffer.from('first'),
            content_type: 'text/plain',
          },
        ],
      },
    ]);

    let entry = await couch.getEntryById('shared_attachment', user);
    expect(entry.$content.jpath).toMatchObject([
      { reference: 'ref1', file: { filename: 'jpath/first.txt' } },
      { reference: 'ref2', file: { filename: shared } },
    ]);
    expect(Object.keys(entry._attachments).sort()).toStrictEqual([
      'jpath/first.txt',
      shared,
    ]);

    // ref2 moves too: nothing references the shared attachment anymore, so it is removed
    await couch._addFileToJpath('shared_attachment', user, [
      {
        jpath: ['jpath'],
        reference: 'ref2',
        attachments: [
          {
            field: 'file',
            filename: 'jpath/second.txt',
            contents: Buffer.from('second'),
            content_type: 'text/plain',
          },
        ],
      },
    ]);

    entry = await couch.getEntryById('shared_attachment', user);
    expect(entry.$content.jpath).toMatchObject([
      { reference: 'ref1', file: { filename: 'jpath/first.txt' } },
      { reference: 'ref2', file: { filename: 'jpath/second.txt' } },
    ]);
    expect(Object.keys(entry._attachments).sort()).toStrictEqual([
      'jpath/first.txt',
      'jpath/second.txt',
    ]);
  });
});
