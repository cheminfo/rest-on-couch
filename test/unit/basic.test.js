import assert from 'node:assert';

import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import Couch from '../../src/index.js';
import constants from '../../src/constants.js';
import entryUnicity from '../data/byOwnerEntryUnicity.js';
import { resetDatabaseWithoutCouch } from '../utils/utils.js';

import { getCouchMajorVersion } from '../utils/couch.js';

process.on('unhandledRejection', function handleUnhandledRejection(err) {
  throw err;
});

describe('basic initialization tests', () => {
  it('should init', async () => {
    await resetDatabaseWithoutCouch('test2');
    const couch = Couch.get('test2');
    return couch.open();
  });

  it('should throw if no database given', () => {
    return expect(Promise.resolve().then(() => new Couch())).rejects.toThrow(
      'database option is mandatory',
    );
  });

  it('should throw on invalid db name', () => {
    expect(() => new Couch({ database: '_test' })).toThrow(
      /invalid database name/,
    );

    expect(() => {
      Couch.get(1);
    }).toThrow(/database name must be a string/);
  });
});

describe('basic initialization with custom design docs', () => {
  beforeEach(entryUnicity);

  it('should have initialized the main app design document', async ({
    assert,
  }) => {
    const app = await couch._db.getDocument(
      `_design/${constants.DESIGN_DOC_NAME}`,
    );
    assert.notEqual(app, null);
    assert.snapshot(app.filters?.abc);
  });

  it('should have initialized the default custom design doc', async () => {
    const app = await couch._db.getDocument(
      `_design/${constants.CUSTOM_DESIGN_DOC_NAME}`,
    );
    assert.notEqual(app, null);
    assert.ok(app.views.test);
  });

  it('should have initialized a named custom views design doc', async () => {
    const custom = await couch._db.getDocument('_design/custom');
    assert.notEqual(custom, null);
    assert.ok(custom.views.testCustom);
  });

  it('should have initialized a named custom index design doc', async () => {
    const custom = await couch._db.getDocument('_design/modDateIndex');
    const couchdbVersion = await getCouchMajorVersion();
    if (couchdbVersion === 1) {
      // In CouchDB 1, there is no support for mango indexes so this design doc is not created.
      assert.equal(custom, null);
    } else {
      assert.notEqual(custom, null);
      assert.ok(custom.views.modDate);
    }
  });

  it('should query a custom design document', () => {
    return couch.queryEntriesByUser('a@a.com', 'testCustom').then((data) => {
      expect(data).toHaveLength(1);
    });
  });
});
