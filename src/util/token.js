'use strict';

const randomatic = require('randomatic');

const getRandomToken = () => randomatic('Aa0', 32);

const CouchError = require('./CouchError');
const ensureStringArray = require('./ensureStringArray');

exports.createEntryToken = async function createEntryToken(
  db,
  user,
  uuid,
  rights
) {
  rights = ensureStringArray(rights, 'rights');
  const token = {
    $type: 'token',
    $kind: 'entry',
    $id: getRandomToken(),
    $owner: user,
    $creationDate: Date.now(),
    uuid,
    rights
  };
  await db.insertDocument(token);
  return token;
};

exports.createUserToken = async function createUserToken(db, user, rights) {
  rights = ensureStringArray(rights, 'rights');
  const token = {
    $type: 'token',
    $kind: 'user',
    $id: getRandomToken(),
    $owner: user,
    $creationDate: Date.now(),
    rights
  };
  await db.insertDocument(token);
  return token;
};

exports.getToken = async function getToken(db, tokenId) {
  const result = await db.queryView(
    'tokenById',
    { key: tokenId, include_docs: true },
    { onlyDoc: true }
  );
  if (result.length === 0) {
    return null;
  } else if (result.length === 1) {
    return result[0];
  } else {
    throw new CouchError('multiple tokens with the same ID', 'fatal');
  }
};

exports.getTokens = function getTokens(db, user) {
  return db.queryView(
    'tokenByOwner',
    { key: user, include_docs: true },
    { onlyDoc: true }
  );
};

exports.destroyToken = function destroyToken(db, tokenId, rev) {
  return db.destroyDocument(tokenId, rev);
};
