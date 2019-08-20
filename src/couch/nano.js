'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:nano');

async function getGroup(db, name) {
  debug.trace('get group');
  const groups = await db.queryView('groupByName', {
    key: name,
    reduce: false,
    include_docs: true,
  });
  if (!groups || groups.length === 0) {
    debug.trace('group does not exist');
    return null;
  }
  if (groups.length > 1) {
    debug.warn('Getting more than one result for a group name');
  }
  debug.trace('group exists');
  return groups[0].doc;
}

function save(db, entry, user) {
  switch (entry.$type) {
    case 'entry':
      return saveEntry(db, entry, user);
    case 'group':
      return saveGroup(db, entry, user);
    default:
      throw new CouchError(`invalid type: ${entry.$type}`);
  }
}

function saveEntry(db, entry, user) {
  if (entry.$id === undefined) {
    entry.$id = null;
  }
  if (entry.$kind === undefined) {
    entry.$kind = null;
  }
  return saveWithFields(db, entry, user);
}

function saveGroup(db, group, user) {
  return saveWithFields(db, group, user);
}

async function saveWithFields(db, object, user) {
  const now = Date.now();
  object.$lastModification = user;
  object.$modificationDate = now;
  if (object.$creationDate === undefined) {
    object.$creationDate = now;
  }

  const result = await db.insertDocument(object);
  result.$modificationDate = object.$modificationDate;
  result.$creationDate = object.$creationDate;
  return result;
}

function getUuidFromId(db, id, user, type) {
  switch (type) {
    case 'entry':
      return getUuidFromIdEntry(db, id, user);
    case 'group':
      return getUuidFromIdGroup(db, id);
    default:
      throw new CouchError(`invalid type: ${type}`);
  }
}

async function getUuidFromIdEntry(db, id, user) {
  const owners = await db.queryView('ownerByTypeAndId', {
    key: ['entry', id],
  });
  if (owners.length === 0) {
    throw new CouchError('document not found', 'not found');
  }
  const hisEntry = owners.find((own) => own.value === user);
  if (!hisEntry) {
    throw new CouchError('document not found', 'not found');
  }
  return hisEntry.id;
}

async function getUuidFromIdGroup(db, id) {
  const owners = await db.queryView('ownerByTypeAndId', {
    key: ['group', id],
  });
  if (owners.length === 0) {
    throw new CouchError('document not found', 'not found');
  }
  if (owners.length !== 1) {
    throw new CouchError(
      `unexpected number of results: ${owners.length}. There should be only one`,
    );
  }
  return owners[0].id;
}

module.exports = {
  getGroup,
  saveEntry,
  saveGroup,
  save,
  getUuidFromId,
};
