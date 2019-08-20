'use strict';

const Couch = require('../..');
const connect = require('../../src/connect');

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
  const nano = await connect.open();
  try {
    await destroy(nano, databaseName);
  } catch (e) {
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
        names: ['admin'],
        roles: [],
      },
      members: {
        names: ['admin'],
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
