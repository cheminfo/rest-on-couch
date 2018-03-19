'use strict';

const Couch = require('../..');

const { resetDatabase } = require('./helper');
const insertDocument = require('./insertDocument');

function populate(db) {
  const prom = [];

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'groupA', 'groupB'],
      $id: 'A',
      $content: {}
    })
  );

  return Promise.all(prom);
}

module.exports = async function () {
  global.couch = new Couch({ database: 'test' });
  await global.couch.open();
  await resetDatabase(
    global.couch._nano,
    global.couch._databaseName,
    global.couch._couchOptions.username
  );
  global.couch = new Couch({
    database: 'test',
    rights: {
      read: ['anyuser']
    }
  });
  await global.couch.open();
  await populate(global.couch._db);
};
