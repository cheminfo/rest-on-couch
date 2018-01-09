'use strict';
const Couch = require('../..');
const nanoPromise = require('../../src/util/nanoPromise');

module.exports = {
  resetDatabase
};

async function resetDatabase(databaseName) {
  let importCouch = new Couch({ database: databaseName });
  await importCouch.open();
  await destroy(importCouch._nano, importCouch._databaseName);
  importCouch = new Couch({ database: databaseName });
  await importCouch.open();
  return importCouch;
}

function destroy(nano, name) {
  return nanoPromise.destroyDatabase(nano, name);
}
