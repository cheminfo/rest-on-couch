'use strict';

const { resetDatabase } = require('../utils/utils');

const insertDocument = require('./insertDocument');

function populate(db) {
  const prom = [];

  // Add groups
  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupA',
      description: 'groupA description',
      users: ['a@a.com'],
      rights: ['create', 'write', 'delete', 'read'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'group',
      $owners: ['a@a.com'],
      name: 'groupB',
      users: ['a@a.com'],
      rights: ['create'],
    }),
  );

  // Add users
  prom.push(
    insertDocument(db, {
      $type: 'user',
      user: 'a@a.com',
      val: 'a',
    }),
  );

  // Add entries
  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['a@a.com'],
      $id: 'documentOfA',
      $content: {},
    }),
  );

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
      $owners: ['a@a.com'],
      $id: 'B',
      $content: {},
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com'],
      $id: 'C',
      $content: {},
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['b@b.com', 'groupC'],
      $id: 'anonymousEntry',
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'entry',
      $owners: ['c@c.com'],
      $id: 'entryWithAttachment',
      _attachments: {
        'test.txt': {
          content_type: 'text/plain',
          data: 'VEhJUyBJUyBBIFRFU1Q=',
        },
      },
    }),
  );

  // Add tokens
  prom.push(
    insertDocument(db, {
      $type: 'token',
      $kind: 'entry',
      $owner: 'b@b.com',
      $id: 'myReadOnlyToken',
      $creationDate: 0,
      uuid: 'documentOfA',
      rights: ['read'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'token',
      $kind: 'entry',
      $owner: 'b@b.com',
      $id: 'myAddAttachmentToken',
      $creationDate: 0,
      uuid: 'documentOfA',
      rights: ['read', 'addAttachment', 'write'],
    }),
  );

  prom.push(
    insertDocument(db, {
      $type: 'token',
      $kind: 'user',
      $owner: 'b@b.com',
      $id: 'myUserToken',
      $creationDate: 0,
      rights: ['create', 'delete', 'read', 'write', 'addAttachment'],
    }),
  );

  return Promise.all(prom);
}

module.exports = async function () {
  global.couch = await resetDatabase('test', {
    database: 'test',
    rights: {
      read: ['anonymous'],
      createGroup: ['anyuser'],
      create: ['anyuser'],
      addAttachment: ['anyuser'],
      readGroup: ['b@b.com'],
    },
  });
  await populate(global.couch._db);
};
