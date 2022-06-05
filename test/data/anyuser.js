'use strict';

const { resetDatabase } = require('../utils/utils');

const insertDocument = require('./insertDocument');

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

module.exports = async function () {
  global.couch = await resetDatabase('test', {
    database: 'test',
    rights: {
      read: ['anyuser'],
    },
  });
  await populate(global.couch._db);
};
