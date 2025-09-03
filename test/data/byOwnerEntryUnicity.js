import { resetDatabase } from '../utils/utils.js';

import insertDocument from './insertDocument.js';

function populate(db) {
  const prom = [];

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com', 'groupA', 'groupB'],
      $id: 'X',
      $content: {},
    }),
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'groupA', 'groupB'],
      $id: 'Y',
      $content: {},
    }),
  );

  return Promise.all(prom);
}

export default async function populateByOwnerUnicity() {
  global.couch = await resetDatabase('test-by-owner-unicity', {
    database: 'test-by-owner-unicity',
    rights: {
      create: ['anyuser'],
    },
  });
  await populate(global.couch._db);
}
