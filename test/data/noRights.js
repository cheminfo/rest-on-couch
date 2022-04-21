'use strict';

const { resetDatabase } = require('../utils/utils');

const insertDocument = require('./insertDocument');

function populate(db) {
  const prom = [];
  // Default groups
  prom.push(
    (async () => {
      const doc = await db.getDocument('defaultGroups');
      await db.insertDocument({
        _id: 'defaultGroups',
        _rev: doc._rev,
        $type: 'db',
        anonymous: ['defaultAnonymousRead', 'inexistantGroup'],
        anyuser: ['defaultAnyuserRead'],
      });
    })(),
  );

  // Groups
  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupA',
      users: ['a@a.com'],
      customUsers: ['a@a.com'],
      rights: ['create', 'write', 'delete', 'read'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupB',
      users: ['b@b.com', 'c@c.com'],
      customUsers: ['b@b.com', 'c@c.com'],
      rights: ['create'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'defaultAnonymousRead',
      users: [],
      customUsers: [],
      rights: ['read'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'defaultAnyuserRead',
      users: [],
      customUsers: [],
      rights: ['read'],
    }),
  );

  // Entries
  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'groupA', 'groupB'],
      $id: 'A',
      $content: {},
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com'],
      $id: 'onlyB',
      $content: {},
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com'],
      $id: 'onlyA',
      $content: {},
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead'],
      $id: 'entryWithDefaultAnonymousRead',
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultAnyuserRead',
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultMultiRead',
    }),
  );

  // Tokens
  prom.push(
    insertDocument(db, {
      $type: 'token',
      $kind: 'entry',
      $owner: 'x@x.com',
      $id: 'mytoken',
      $creationDate: 0,
      uuid: 'A',
      rights: ['read'],
    }),
  );

  return Promise.all(prom);
}

module.exports = createDatabase;

async function createDatabase() {
  global.couch = await resetDatabase('test');
  await populate(global.couch._db);
}
