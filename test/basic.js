'use strict';

const Couch = require('..');
const nanoPromise = require('../src/util/nanoPromise');
const assert = require('assert');
const entryUnicity = require('./data/entryUnicity');
const constants = require('../src/constants');

process.on('unhandledRejection', function (err) {
  throw err;
});

describe('basic initialization tests', () => {
  let couch;
  beforeEach(() => {
    couch = Couch.get('test2');
  });
  test('should init', () => {
    return couch.open();
  });

  test('should throw if no database given', () => {
    return expect(
      Promise.resolve().then(() => {
        new Couch(); // eslint-disable-line no-new
      })
    ).rejects.toThrow('database option is mandatory');
  });

  test('should throw on invalid db name', () => {
    expect(function () {
      new Couch({ database: '_test' }); // eslint-disable-line no-new
    }).toThrowError(/invalid database name/);

    expect(function () {
      Couch.get(1);
    }).toThrowError(/database name must be a string/);
  });
});

describe('basic initialization with custom design docs', () => {
  beforeEach(entryUnicity);

  test('should load the design doc files at initialization', () => {
    const app = nanoPromise
      .getDocument(couch._db, `_design/${constants.DESIGN_DOC_NAME}`)
      .then((app) => {
        assert.notEqual(app, null);
        assert.ok(app.filters.abc);
      });
    const customApp = nanoPromise
      .getDocument(couch._db, `_design/${constants.CUSTOM_DESIGN_DOC_NAME}`)
      .then((app) => {
        assert.notEqual(app, null);
        assert.ok(app.views.test);
      });
    const custom = nanoPromise
      .getDocument(couch._db, '_design/custom')
      .then((custom) => {
        assert.notEqual(custom, null);
        assert.ok(custom.views.testCustom);
      });

    return Promise.all([app, customApp, custom]);
  });

  test('should query a custom design document', () => {
    return couch.queryEntriesByUser('a@a.com', 'testCustom').then((data) => {
      expect(data).toHaveLength(0);
    });
  });
});
