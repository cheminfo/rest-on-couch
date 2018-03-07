'use strict';

const imp = require('../../src/import/import');
const path = require('path');
const testUtils = require('../utils/utils');

const databaseName = 'test-new-import';

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile = path.resolve(
  __dirname,
  '../homedir/test-new-import/simple/to_process/test.txt'
);
// const jsonFile = path.resolve(__dirname, '../homedir/test-new-import/simple/to_process/test.json');

describe('import', () => {
  beforeAll(async function () {
    importCouch = await testUtils.resetDatabase(databaseName);
  });
  test('full import', () => {
    return imp.import(databaseName, 'simple', textFile).then(() => {
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
          'other/jpath/testFilename.txt'
        );

        // check attachments
        const mainAttachment = data._attachments['jpath/in/document/test.txt'];
        const secondaryAttachment =
          data._attachments['other/jpath/testFilename.txt'];
        expect(mainAttachment).toBeDefined();
        expect(secondaryAttachment).toBeDefined();
        expect(mainAttachment.content_type).toBe('plain/text');
        expect(secondaryAttachment.content_type).toBe('plain/text');
      });
    });
  });

  test('All attachments and metadata are separate', () => {
    return imp.import(databaseName, 'separate', textFile).then(() => {
      return importCouch.getEntryById('separate', 'a@a.com').then((data) => {
        expect(data).toBeDefined();
        expect(data.$content).toBeDefined();

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

        // check attachmentss
        const secondaryAttachment = data._attachments['other/jpath/test.txt'];
        expect(secondaryAttachment).toBeDefined();
        expect(secondaryAttachment.content_type).toBe('plain/text');
      });
    });
  });
});
