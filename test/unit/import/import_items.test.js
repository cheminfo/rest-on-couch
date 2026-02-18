// TODO: resolve all files from the same directory?

// TODO: test adding multiple attachments. Is it tested?

import path from 'node:path';

import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import importFile from '../../../src/import/index.mjs';
import { resetDatabase } from '../../utils/utils.js';

let importCouch;
const databaseName = 'test-new-import';

const multiFile = path.resolve(
  import.meta.dirname,
  '../../homeDirectories/main/test-new-import/multi/to_process/test_multi.txt',
);

describe('import with importItems', () => {
  beforeEach(async () => {
    importCouch = await resetDatabase(databaseName);
  });
  it('import multiple attachments', async () => {
    await importFile(databaseName, 'multi', multiFile);
    const entry = await importCouch.getEntryById('multiText.txt', 'a@a.com');
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
      reference: '0_test_multi.txt',
      field0: { filename: 'jpath/in/document/0_test_multi.txt' },
      value: 0,
    });
    expect(metadata1).toMatchObject({
      reference: '1_test_multi.txt',
      field1: { filename: 'jpath/in/document/1_test_multi.txt' },
      value: 1,
    });

    // No attachments
    expect(Object.keys(entry._attachments)).toHaveLength(2);
    expect(
      entry._attachments['jpath/in/document/0_test_multi.txt'],
    ).toMatchObject({
      content_type: 'text/plain',
      length: 5,
    });

    expect(
      entry._attachments['jpath/in/document/1_test_multi.txt'],
    ).toMatchObject({
      content_type: 'text/plain',
      length: 6,
    });
  });
});
