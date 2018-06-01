'use strict';

const path = require('path');

const Couch = require('../../..');
const imp = require('../../../src/import/import');
const nanoPromise = require('../../../src/util/nanoPromise');

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile = path.resolve(
  __dirname,
  '../../homeDirectories/main/test-import/parse/to_process/test.txt'
);
const jsonFile = path.resolve(
  __dirname,
  '../../homeDirectories/main/test-import/json/to_process/test.json'
);

describe('legacy import', () => {
  beforeEach(initCouch);
  test('parse', () => {
    return imp.import('test-import', 'parse', textFile).then(() => {
      return importCouch
        .getEntryById('parse', 'test-import@test.com')
        .then((data) => {
          expect(data).toBeDefined();
          expect(data.$content).toBeDefined();
          expect(data.$content.txt).toHaveProperty('length');
          const txt = data.$content.txt[0];
          expect(txt).toBeDefined();
          expect(txt.abc).toBe('test');
          expect(txt.filename).toBe('test.txt');
          expect(txt.txt).toBeDefined();
          expect(txt.contents).toBe('Content of test file');
        });
    });
  });

  test('ignore import', () => {
    return imp.import('test-import', 'ignore', textFile).then(() => {
      return expect(
        importCouch.getEntryById('ignored', 'test-import@test.com')
      ).rejects.toThrow(/not found/);
    });
  });

  test('import json file', () => {
    return imp.import('test-import', 'json', jsonFile).then(() => {
      return expect(
        importCouch.getEntryById('json', 'test-import@test.com')
      ).resolves.toBeDefined();
    });
  });
});

function initCouch() {
  importCouch = new Couch({ database: 'test-import' });
  return importCouch
    .open()
    .then(() => destroy(importCouch._nano, importCouch._databaseName))
    .then(() => {
      importCouch = new Couch({
        database: 'test-import'
      });
      return importCouch.open();
    });
}

function destroy(nano, name) {
  return nanoPromise.destroyDatabase(nano, name);
}
