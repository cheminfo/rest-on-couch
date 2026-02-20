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
  assertUpdateExisting,
} from './assert_import_entry.mjs';
import { assertImportLog } from './assert_import_log.mjs';

let importCouch;
const databaseName = 'test-import-items';

const testFile = path.resolve(import.meta.dirname, '../../to_process/test.txt');

describe('import (new)', () => {
  beforeEach(async () => {
    importCouch = await resetDatabase(databaseName);
  });
  it('import multiple items', async () => {
    await importFile(databaseName, 'multiple_analyses', testFile);
    const entry = await importCouch.getEntryById(
      'multiple_analyses',
      'a@a.com',
    );
    expect(entry).toBeDefined();
    expect(entry.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);
    expect(entry.$content).toBeDefined();
    // Check that new content has been merged
    expect(entry.$content.sideEffect).toBe(true);
    expect(entry.$content.jpath.in.document).toHaveLength(2);
    const [metadata0, metadata1] = entry.$content.jpath.in.document;
    expect(metadata0).toBeDefined();

    // Automatic fields were added
    expect(typeof metadata0.$modificationDate).toBe('number');
    expect(typeof metadata0.$creationDate).toBe('number');
    expect(typeof metadata1.$modificationDate).toBe('number');
    expect(typeof metadata1.$creationDate).toBe('number');

    // Metadata was added to the jpath, without a referenced attachment
    expect(metadata0).toMatchObject({
      reference: '0_test.txt',
      field0: { filename: 'jpath/in/document/0_test.txt' },
      value: 0,
    });
    expect(metadata1).toMatchObject({
      reference: '1_test.txt',
      field1: { filename: 'jpath/in/document/1_test.txt' },
      value: 1,
    });

    // No attachments
    expect(Object.keys(entry._attachments)).toHaveLength(2);
    expect(entry._attachments['jpath/in/document/0_test.txt']).toMatchObject({
      content_type: 'text/plain',
      length: 5,
    });

    expect(entry._attachments['jpath/in/document/1_test.txt']).toMatchObject({
      content_type: 'text/plain',
      length: 6,
    });
  });

  it('jpath points to non-array', async () => {
    await importCouch.insertEntry(
      {
        $id: 'default_analysis',
        $content: {
          jpath: 'string instead of array',
        },
      },
      'a@a.com',
    );
    await expect(
      importFile(databaseName, 'default_analysis', testFile),
    ).rejects.toThrow(/jpath must point to an array/);

    await assertImportLog(importCouch, {
      name: 'default_analysis',
      filename: 'test.txt',
      status: 'ERROR',
      error: { message: 'jpath must point to an array' },
    });
  });

  it('no return', async () => {
    await expect(
      importFile(databaseName, 'no_return', testFile),
    ).rejects.toThrow(
      /The importAnalyses function did not return the expected result/,
    );

    await assertImportLog(importCouch, {
      name: 'no_return',
      filename: 'test.txt',
      status: 'ERROR',
      error: {
        message:
          'The importAnalyses function did not return the expected result.\nMake sure to always return an instance of EntryImportResult, which can be created by calling the second argument of the function.',
      },
    });
  });
});

describe('import (current) - shared scenarios with legacy import API', () => {
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

  it('update existing entry', async () => {
    await importFile(databaseName, 'update_analysis', testFile);
    let entry = await importCouch.getEntryById('update_analysis', 'a@a.com');
    assertUpdateExisting(entry, 0);

    await importFile(databaseName, 'update_analysis', testFile);
    entry = await importCouch.getEntryById('update_analysis', 'a@a.com');
    assertUpdateExisting(entry, 1);
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
