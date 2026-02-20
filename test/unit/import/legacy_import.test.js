import path from 'node:path';

import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import importFile from '../../../src/import/index.mjs';
import { resetDatabase } from '../../utils/utils.js';
import {
  assertDefaultAnalysis,
  assertDefaultAnalysisDryRun,
  assertMultipleAttachments,
  assertMultipleJpath,
  assertNoAttachment,
} from './assert_import_entry.mjs';
import { assertImportLog } from './assert_import_log.mjs';

const databaseName = 'test-new-import';

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile1 = path.resolve(
  import.meta.dirname,
  '../../homeDirectories/main/test-new-import/full/to_process/test.txt',
);

const textFile2 = path.resolve(
  import.meta.dirname,
  '../../homeDirectories/main/test-new-import/change_filename/to_process/test.txt',
);

const testFile = path.resolve(import.meta.dirname, '../../to_process/test.txt');

describe('import (legacy)', () => {
  beforeEach(async () => {
    importCouch = await resetDatabase(databaseName);
  });
  it('full import', async () => {
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
    expect(secondaryAttachment).toMatchObject({
      content_type: 'text/plain',
      length: 24,
    });
    expect(mainAttachment).toMatchObject({
      content_type: 'text/plain',
      // 200 lines with 22 chars (and last line does not have the line feed char)
      length: 22 * 200 - 1,
    });

    // check log
    await assertImportLog(importCouch, {
      name: 'full',
      filename: 'test.txt',
      status: 'SUCCESS',
      result: {
        id: 'test.txt',
        owner: 'a@a.com',
        kind: 'sample',
      },
    });
  });

  it('change filename', async () => {
    await importFile(databaseName, 'change_filename', textFile2);
    const entry = await importCouch.getEntryById('test.txt', 'a@a.com');
    const attachment = entry._attachments['jpath/in/document/newFilename.txt'];
    expect(attachment).toBeDefined();
    let metadata = entry.$content.jpath.in.document[0];
    expect(metadata).toBeDefined();
    expect(metadata.hasMetadata).toBe(true);
    expect(metadata.field.filename).toBe('jpath/in/document/newFilename.txt');
  });

  it('All attachments and metadata are separate', async () => {
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

  it('without reference', async () => {
    await expect(() =>
      importFile(databaseName, 'no_reference', textFile1),
    ).rejects.toThrow(/reference must be of type String/);

    // Check that the error has been logged in the import database
    await assertImportLog(importCouch, {
      name: 'no_reference',
      filename: 'test.txt',
      status: 'ERROR',
      error: { message: 'reference must be of type String' },
    });
  });

  it('error when the import function throws', async () => {
    await expect(importFile(databaseName, 'error', textFile1)).rejects.toThrow(
      /this import is wrong/,
    );

    await assertImportLog(importCouch, {
      name: 'error',
      filename: 'test.txt',
      status: 'ERROR',
      error: { message: 'this import is wrong' },
    });
  });

  it('load import.mjs using ESM syntax', async () => {
    const { result } = await importFile(databaseName, 'esm_mjs', textFile1);
    expect(result).toBeDefined();
    expect(result.id).toBe('esm_import');
  });
});

describe('import (legacy) - shared scenarios with current import API', () => {
  beforeEach(async () => {
    importCouch = await resetDatabase(databaseName);
  });
  it(`default analysis with additional attachments`, async () => {
    await importFile(databaseName, 'multiple_analysis_attachments', testFile);
    const entry = await importCouch.getEntryById(
      'multiple_analysis_attachments',
      'a@a.com',
    );
    assertMultipleAttachments(entry);
  });

  it('default analysis', async () => {
    await importFile(databaseName, 'default_analysis', testFile);
    const entry = await importCouch.getEntryById('default_analysis', 'a@a.com');
    assertDefaultAnalysis(entry);
  });

  it('no attachment', async () => {
    await importFile(databaseName, 'no_attachment', testFile);
    const entry = await importCouch.getEntryById('no_attachment', 'a@a.com');
    assertNoAttachment(entry);
  });

  it('multiple items with different jpaths', async () => {
    await importFile(databaseName, 'multiple_jpath', testFile);
    const entry = await importCouch.getEntryById('multiple_jpath', 'a@a.com');
    assertMultipleJpath(entry);
  });

  it('skip import', async () => {
    const result = await importFile(databaseName, 'skip', testFile);
    expect(result).toStrictEqual({
      skip: 'skip',
    });
  });

  it('dry run of default analysis', async () => {
    const result = await importFile(
      databaseName,
      'default_analysis',
      testFile,
      { dryRun: true },
    );
    expect(() =>
      importCouch.getEntryById('default_analysis', 'a@a.com'),
    ).rejects.toThrow(/document not found/);
    assertDefaultAnalysisDryRun(result);
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
