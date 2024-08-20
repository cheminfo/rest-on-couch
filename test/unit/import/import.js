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
  '../../homeDirectories/main/test-new-import/full/to_process/test.txt',
);

const textFile2 = path.resolve(
  __dirname,
  '../../homeDirectories/main/test-new-import/changeFilename/to_process/test.txt',
);

describe('import', () => {
  beforeEach(async () => {
    importCouch = await testUtils.resetDatabase(databaseName);
  });
  test('full import', async () => {
    await importFile(databaseName, 'full', textFile1);
    const data = await importCouch.getEntryById('test.txt', 'a@a.com');
    expect(data).toBeDefined();
    expect(data.$content).toBeDefined();
    // Check that new content has been merged
    expect(data.$content.sideEffect).toBe(true);

    // Check that the correct owners have been added
    expect(data.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);

    // Main metadata
    const metadata = data.$content.jpath.in.document[0];
    expect(metadata).toBeDefined();
    // Automatic fields were added
    expect(typeof metadata.$modificationDate).toBe('number');
    expect(typeof metadata.$creationDate).toBe('number');
    // metadata has been added
    expect(metadata.hasMetadata).toBe(true);
    // a reference to the attachment has been added
    expect(metadata.field.filename).toBe('jpath/in/document/test.txt');
    // Reference has been added
    expect(metadata.reference).toBe('test.txt');

    // Additional metadata
    const otherMetadata = data.$content.other.jpath[0];
    expect(otherMetadata).toBeDefined();
    // Automatic field was added
    expect(typeof otherMetadata.$modificationDate).toBe('number');
    expect(typeof otherMetadata.$creationDate).toBe('number');

    // Mandatory field
    expect(otherMetadata.reference).toBe('testRef');
    // Custom field
    expect(otherMetadata.hasMetadata).toBe(true);
    // Field of additional attachment
    expect(otherMetadata.testField.filename).toBe(
      'other/jpath/testFilename.txt',
    );
    // Primary attachment has no file
    expect(otherMetadata.field).not.toBeDefined();

    // check attachments
    const mainAttachment = data._attachments['jpath/in/document/test.txt'];
    const secondaryAttachment =
      data._attachments['other/jpath/testFilename.txt'];
    expect(mainAttachment).toBeDefined();
    expect(secondaryAttachment).toBeDefined();
    expect(mainAttachment.content_type).toBe('text/plain');
    expect(secondaryAttachment.content_type).toBe('text/plain');

    // check log
    const importLogs = await importCouch._db.queryView(
      'importsByDate',
      {
        descending: true,
        include_docs: true,
      },
      { onlyDoc: true },
    );
    expect(importLogs).toHaveLength(1);
    expect(importLogs[0]).toMatchObject({
      name: 'full',
      filename: 'test.txt',
      status: 'SUCCESS',
    });
    expect(importLogs[0].result).toMatchObject({
      id: 'test.txt',
      owner: 'a@a.com',
      kind: 'sample',
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
    const metadata = data.$content.other.jpath[0];
    expect(metadata).toBeDefined();
    // Automatic field
    expect(typeof metadata.$modificationDate).toBe('number');
    expect(typeof metadata.$creationDate).toBe('number');
    // Custom metadata
    expect(metadata.hasMetadata).toBe(true);
    // Mandotory reference
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

    const metadata2 = data.$content.other2.jpath[0];
    // Automatic field
    expect(typeof metadata2.$modificationDate).toBe('number');
    expect(typeof metadata2.$creationDate).toBe('number');
    // Mandatory field
    expect(metadata2.reference).toBe('ref2');
  });

  test('without reference', () => {
    expect(() =>
      importFile(databaseName, 'noReference', textFile1),
    ).rejects.toThrow(/reference must be of type String/);
  });

  test('error when the import function throws', async () => {
    await expect(importFile(databaseName, 'error', textFile1)).rejects.toThrow(
      /this import is wrong/,
    );

    // check log
    const importLogs = await importCouch._db.queryView(
      'importsByDate',
      {
        descending: true,
        include_docs: true,
      },
      { onlyDoc: true },
    );
    expect(importLogs).toHaveLength(1);
    expect(importLogs[0]).toMatchObject({
      name: 'error',
      filename: 'test.txt',
      status: 'ERROR',
    });
    expect(importLogs[0].error.message).toBe('this import is wrong');
    expect(typeof importLogs[0].error.stack).toBe('string');
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
