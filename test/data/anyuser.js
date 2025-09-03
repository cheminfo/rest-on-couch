import { resetDatabase } from '../utils/utils.js';

import insertDocument from './insertDocument.js';

function populate(db) {
  const prom = [];

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com', 'groupA', 'groupB'],
      $id: 'A',
      $content: {},
    }),
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com'],
      $id: 'B',
      $content: {},
    }),
  );

  return Promise.all(prom);
}

export default async function populateAnyUser() {
  global.couch = await resetDatabase('test', {
    database: 'test',
    rights: {
      read: ['anyuser'],
    },
  });
  await populate(global.couch._db);
}
