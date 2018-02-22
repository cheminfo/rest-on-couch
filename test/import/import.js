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

describe('import', function () {
  before(async function () {
    importCouch = await testUtils.resetDatabase(databaseName);
  });
  it('full import', function () {
    return imp.import(databaseName, 'simple', textFile).then(() => {
      return importCouch.getEntryById('test.txt', 'a@a.com').then((data) => {
        data.should.be.an.Object();
        data.$content.should.be.an.Object();

        // Check that new content has been merged
        data.$content.sideEffect.should.equal(true);

        // Check that the correct owners have been added
        data.$owners.should.deepEqual([
          'a@a.com',
          'group1',
          'group2',
          'group3'
        ]);

        // Main metadata
        let metadata = data.$content.jpath.in.document[0];
        metadata.should.be.an.Object();
        // metadata has been added
        metadata.hasMetadata.should.equal(true);
        // a reference to the attachment has been added
        metadata.field.filename.should.equal('jpath/in/document/test.txt');
        // Reference has been added
        metadata.reference.should.equal('test.txt');

        // Additional metadata
        metadata = data.$content.other.jpath[0];
        metadata.should.be.an.Object();
        metadata.hasMetadata.should.equal(true);
        metadata.reference.should.equal('testRef');
        metadata.testField.filename.should.equal(
          'other/jpath/testFilename.txt'
        );

        // check attachments
        const mainAttachment = data._attachments['jpath/in/document/test.txt'];
        const secondaryAttachment =
          data._attachments['other/jpath/testFilename.txt'];
        mainAttachment.should.be.an.Object();
        secondaryAttachment.should.be.an.Object();
        mainAttachment.content_type.should.equal('plain/text');
        secondaryAttachment.content_type.should.equal('plain/text');
      });
    });
  });

  it('All attachments and metadata are separate', function () {
    return imp.import(databaseName, 'separate', textFile).then(() => {
      return importCouch.getEntryById('separate', 'a@a.com').then((data) => {
        data.should.be.an.Object();
        data.$content.should.be.an.Object();

        // Check that new content has been merged
        data.$content.sideEffect.should.equal(true);

        // Check that the correct owners have been added
        data.$owners.should.deepEqual([
          'a@a.com',
          'group1',
          'group2',
          'group3'
        ]);

        // Additional metadata
        var metadata = data.$content.other.jpath[0];
        metadata.should.be.an.Object();
        metadata.hasMetadata.should.equal(true);
        metadata.reference.should.equal('testRef');
        metadata.testField.filename.should.equal('other/jpath/test.txt');

        // check attachmentss
        const secondaryAttachment = data._attachments['other/jpath/test.txt'];
        secondaryAttachment.should.be.an.Object();
        secondaryAttachment.content_type.should.equal('plain/text');
      });
    });
  });
});
