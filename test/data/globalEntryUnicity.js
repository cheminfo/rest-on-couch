'use strict';

const { resetDatabase } = require('../utils/utils');

const insertDocument = require('./insertDocument');

function populate(db) {
  const prom = [];

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com'],
      $id: 'X',
      $content: {},
    }),
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'group1'],
      $id: 'Y',
      $content: {},
    }),
    insertDocument(db, {
      $type: 'group',
      $owners: ['b@b.com'],
      name: 'group1',
      users: ['a@a.com'],
      rights: ['owner'],
    }),
  );

  return Promise.all(prom);
}

module.exports = async function populateGlobalUnicity() {
  global.couch = await resetDatabase('test-global-unicity', {
    database: 'test-global-unicity',
    rights: {
      create: ['anyuser'],
    },
  });
  await populate(global.couch._db);
};
