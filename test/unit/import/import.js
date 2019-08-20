'use strict';

const path = require('path');

const { importFile } = require('../../../src/index');
const testUtils = require('../../utils/utils');

const databaseName = 'test-new-import';

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile1 = path.resolve(
  __dirname,
  '../../homeDirectories/main/test-new-import/simple/to_process/test.txt',
);

const textFile2 = path.resolve(
  __dirname,
  '../../homeDirectories/main/test-new-import/changeFilename/to_process/test.txt',
);

describe('import', () => {
  beforeEach(async function() {
    importCouch = await testUtils.resetDatabase(databaseName);
  });
  test('full import', () => {
    return importFile(databaseName, 'simple', textFile1).then(() => {
      return importCouch.getEntryById('test.txt', 'a@a.com').then((data) => {
        expect(data).toBeDefined();
        expect(data.$content).toBeDefined();
        // Check that new content has been merged
        expect(data.$content.sideEffect).toBe(true);

        // Check that the correct owners have been added
        expect(data.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);

        // Main metadata
        let metadata = data.$content.jpath.in.document[0];
        expect(metadata).toBeDefined();
        // metadata has been added
        expect(metadata.hasMetadata).toBe(true);
        // a reference to the attachment has been added
        expect(metadata.field.filename).toBe('jpath/in/document/test.txt');
        // Reference has been added
        expect(metadata.reference).toBe('test.txt');

        // Additional metadata
        metadata = data.$content.other.jpath[0];
        expect(metadata).toBeDefined();
        expect(metadata.hasMetadata).toBe(true);
        expect(metadata.reference).toBe('testRef');
        expect(metadata.testField.filename).toBe(
          'other/jpath/testFilename.txt',
        );

        // check attachments
        const mainAttachment = data._attachments['jpath/in/document/test.txt'];
        const secondaryAttachment =
          data._attachments['other/jpath/testFilename.txt'];
        expect(mainAttachment).toBeDefined();
        expect(secondaryAttachment).toBeDefined();
        expect(mainAttachment.content_type).toBe('text/plain');
        expect(secondaryAttachment.content_type).toBe('text/plain');
      });
    });
  });

  test('change filename', async () => {
    await importFile(databaseName, 'changeFilename', textFile2);
    const entry = await importCouch.getEntryById('test.txt', 'a@a.com');
    const attachment = entry._attachments['jpath/in/document/newFilename.txt'];
    expect(attachment).toBeDefined();
    let metadata = entry.$content.jpath.in.document[0];
    expect(metadata).toBeDefined();
    expect(metadata.hasMetadata).toBe(true);
    expect(metadata.field.filename).toBe('jpath/in/document/newFilename.txt');
  });

  test('All attachments and metadata are separate', async () => {
    await importCouch.insertEntry(
      {
        $kind: 'sample',
        $id: 'separate',
        $content: {
          existingValue: 42,
        },
      },
      'a@a.com',
    );
    await importFile(databaseName, 'separate', textFile1);
    const data = await importCouch.getEntryById('separate', 'a@a.com');
    expect(data).toBeDefined();
    expect(data.$content).toBeDefined();

    // Check that existing content is still there
    expect(data.$content.existingValue).toBe(42);

    // Check that new content has been merged
    expect(data.$content.sideEffect).toBe(true);

    // Check that the correct owners have been added
    expect(data.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);

    // Additional metadata
    var metadata = data.$content.other.jpath[0];
    expect(metadata).toBeDefined();
    expect(metadata.hasMetadata).toBe(true);
    expect(metadata.reference).toBe('testRef');
    expect(metadata.testField.filename).toBe('other/jpath/test.txt');

    // check attachments
    const secondaryAttachment = data._attachments['other/jpath/test.txt'];
    expect(secondaryAttachment).toBeDefined();
    expect(secondaryAttachment.content_type).toBe('text/plain');
    const attachmentStream = await importCouch.getAttachmentByName(
      data._id,
      'other/jpath/test.txt',
      'anonymous',
      true,
    );
    const text = await readStream(attachmentStream);
    const split = text.split('\n');
    expect(split).toHaveLength(200);

    const otherAttachment = data._attachments['other2/jpath/test2.txt'];
    expect(otherAttachment).toBeDefined();
    expect(otherAttachment.content_type).toBe('text/plain');
    const attachmentData = await importCouch.getAttachmentByName(
      data._id,
      'other2/jpath/test2.txt',
    );
    expect(attachmentData.toString('utf8')).toBe('test2');
  });
});

function readStream(stream) {
  return new Promise((resolve, reject) => {
    var str = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => (str += chunk));
    stream.on('end', () => resolve(str));
    stream.on('error', reject);
  });
}
