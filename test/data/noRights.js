import { resetDatabase } from '../utils/utils.js';

import insertDocument from './insertDocument.js';

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
      $content: {
        x: 1,
      },
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com'],
      $id: 'onlyB',
      $content: {
        x: 2,
      },
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com'],
      $id: 'onlyA',
      $content: {
        x: 3,
      },
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead'],
      $id: 'entryWithDefaultAnonymousRead',
      $content: {
        x: 4,
      },
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultAnyuserRead',
      $content: {
        x: 5,
      },
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['x@x.com', 'defaultAnonymousRead', 'defaultAnyuserRead'],
      $id: 'entryWithDefaultMultiRead',
      $content: {
        x: 6,
      },
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

export default async function createDatabase() {
  global.couch = await resetDatabase('test');
  await populate(global.couch._db);
}
