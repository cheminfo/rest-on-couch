'use strict';

const Couch = require('../..');
const globalConfig = require('../../src/config/config').globalConfig;
const getNano = require('../../src/util/nanoShim');

module.exports = {
  resetDatabase,
  resetDatabaseWithoutCouch,
};

async function resetDatabase(
  databaseName,
  options = { database: databaseName },
) {
  await resetDatabaseWithoutCouch(databaseName);
  const couchInstance = new Couch(options);
  await couchInstance.open();
  return couchInstance;
}

async function resetDatabaseWithoutCouch(databaseName) {
  const nano = await getNano(
    globalConfig.url,
    'admin',
    globalConfig.adminPassword,
  );
  try {
    await destroy(nano, databaseName);
  } catch {
    // ignore if db doesn't exist
  }
  // Workaround flaky tests: "The database could not be created, the file already exists."
  await wait(20);
  await create(nano, databaseName);
}

function destroy(nano, db) {
  return nano.destroyDatabase(db);
}

async function create(nano, db) {
  await nano.createDatabase(db);
  await nano.request({
    method: 'PUT',
    db,
    doc: '_security',
    body: {
      admins: {
        names: ['rest-on-couch'],
        roles: [],
      },
      members: {
        names: ['rest-on-couch'],
        roles: [],
      },
    },
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
