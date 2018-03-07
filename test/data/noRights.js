'use strict';

const Couch = require('../..');
const insertDocument = require('./insertDocument');
const { resetDatabase } = require('./helper');

function populate(db) {
  const prom = [];
  prom.push(
    insertDocument(db, {
      _id: 'defaultGroups',
      $type: 'db',
      anonymous: ['defaultAnonymousRead', 'inexistantGroup'],
      anyuser: ['defaultAnyuserRead']
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupA',
      users: ['a@a.com'],
      rights: ['create', 'write', 'delete', 'read']
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupB',
      users: ['b@b.com', 'c@c.com'],
      rights: ['create']
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'defaultAnonymousRead',
      users: [],
      rights: ['read']
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'defaultAnyuserRead',
      users: [],
      rights: ['read']
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'groupA', 'groupB'],
      $id: 'A',
      $content: {}
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com'],
      $id: 'B',
      $content: {}
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com'],
      $id: 'onlyA',
      $content: {}
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead'],
      $id: 'entryWithDefaultAnonymousRead'
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultAnyuserRead'
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultMultiRead'
    })
  );

  prom.push(
    insertDocument(db, {
      $type: 'token',
      $kind: 'entry',
      $owner: 'x@x.com',
      $id: 'mytoken',
      $creationDate: 0,
      uuid: 'A',
      rights: ['read']
    })
  );

  return Promise.all(prom);
}

module.exports = createDatabase;

async function createDatabase() {
  global.couch = new Couch({ database: 'test' });
  await global.couch.open();
  await resetDatabase(
    global.couch._nano,
    global.couch._databaseName,
    global.couch._couchOptions.username
  );
  await populate(global.couch._db);
  global.couch = new Couch({
    database: 'test',
    rights: {}
  });
  await global.couch.open();
}
