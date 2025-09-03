'use strict';

const { getGlobalConfig } = require('../config/config');
const kEntryUnicity = require('../constants').kEntryUnicity;
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:entry');
const ensureStringArray = require('../util/ensureStringArray');

const nanoMethods = require('./nano');
const util = require('./util');
const validateMethods = require('./validate');

const methods = {
  async getEntryWithRights(uuid, user, rights, options = {}) {
    debug('getEntryWithRights (%s, %s, %o)', uuid, user, rights);
    await this.open();

    const doc = await this._db.getDocument(uuid);
    if (!doc) {
      debug.trace('document not found');
      throw new CouchError('document not found', 'not found');
    }
    if (doc.$type !== 'entry') {
      debug.trace('document is not an entry');
      throw new CouchError('document is not an entry', 'not entry');
    }

    debug.trace('check rights for user %s', user);
    if (
      await validateMethods.validateTokenOrRights(
        this,
        uuid,
        doc.$owners,
        rights,
        user,
        options.token,
        'entry',
      )
    ) {
      debug.trace('user %s has access', user);
      if (!options) {
        return doc;
      } else {
        return this._db.getDocument(uuid, options);
      }
    }

    debug.trace('user %s has no %o access', user, rights);
    throw new CouchError('user has no access', 'unauthorized');
  },

  getEntry(uuid, user, options) {
    return this.getEntryWithRights(uuid, user, 'read', options);
  },

  async getEntryById(id, user, options) {
    await this.open();
    debug('getEntryById (%s, %s)', id, user);
    if (id == null) {
      throw new CouchError(
        'id must be defined in getEntryById',
        'bad argument',
      );
    }
    const doc = await getUniqueEntryByIdOrFail(this, user, id);
    return this.getDocByRights(doc._id, user, 'owner', 'entry', options);
  },

  async deleteEntry(uuid, user, options) {
    debug('deleteEntry (%s, %s)', uuid, user);
    const entry = await this.getEntryWithRights(uuid, user, 'delete', options);
    entry._deleted = true;
    return nanoMethods.saveEntry(this._db, entry, user);
  },

  // Create entry if does not exist
  async ensureExistsOrCreateEntry(id, user, options) {
    options = options || {};
    debug(
      'ensureExistsOrCreateEntry (id: %s, user: %s, kind: %s)',
      id,
      user,
      options.kind,
    );
    await this.open();
    const doc = await getUniqueEntryById(this, user, id);
    if (doc === undefined) {
      let newEntry;
      const defaultEntry = this._defaultEntry;
      if (typeof defaultEntry === 'function') {
        newEntry = defaultEntry(...(options.createParameters || []));
      } else if (typeof defaultEntry[options.kind] === 'function') {
        newEntry = defaultEntry[options.kind].apply(
          null,
          options.createParameters || [],
        );
      } else {
        throw new CouchError('unexpected type for default entry');
      }
      const owners = options.owners || [];
      const entry = await Promise.resolve(newEntry);
      const toInsert = {
        $id: id,
        $content: entry,
        $kind: options.kind,
      };
      return createNew(this, toInsert, user, {
        groups: owners,
      });
    }
    debug.trace('entry already exists');
    if (options.throwIfExists) {
      throw new CouchError('entry already exists', 'conflict');
    }
    // Return something similar to insertDocument
    return {
      ok: true,
      isNew: false,
      id: doc._id,
      rev: doc._rev,
      $modificationDate: doc.$modificationDate,
      $creationDate: doc.$creationDate,
    };
  },

  async getEntriesByUserAndRights(user, rights = ['read'], options = {}) {
    debug('getEntriesByUserAndRights (%s, %o)', user, rights);
    rights = ensureStringArray(rights, 'rights');

    const limit = options.limit;
    const skip = options.skip;
    const from = +options.from || 0;
    const owner = options.owner;
    let includeDocs = true;
    if (options.includeDocs === false || options.includeDocs === 'false') {
      includeDocs = false;
    }
    const includeDate = options.includeDate;

    await this.open();

    // First we get a list of owners for each document
    let owners = await this._db.queryView('ownersByModificationDate', {
      reduce: false,
      include_docs: false,
      startkey: from,
    });

    user = validateMethods.userFromTokenAndRights(user, options.token, rights);

    let allowedDocs;
    if (typeof owner === 'string') {
      owners = owners.filter((res) => res.value[0] === owner);
      if (owner === user) {
        allowedDocs = owners;
      }
    }

    if (allowedDocs === undefined) {
      // Check rights for current user and keep only documents with granted access
      const hasRights = await validateMethods.validateRights(
        this,
        owners.map((r) => r.value),
        user,
        rights || 'read',
      );
      allowedDocs = owners.filter((r, idx) => hasRights[idx]);
    }

    // Apply pagination options
    if (skip) allowedDocs = allowedDocs.slice(skip);
    if (limit) allowedDocs = allowedDocs.slice(0, limit);

    if (includeDocs) {
      // Get each document from CouchDB
      return Promise.all(
        allowedDocs.map((doc) => this._db.getDocument(doc.id)),
      );
    } else if (includeDate) {
      return allowedDocs.map((doc) => ({
        id: doc.id,
        date: doc.key,
      }));
    } else {
      return allowedDocs.map((doc) => doc.id);
    }
  },

  async _doUpdateOnEntry(uuid, user, update, updateBody) {
    await this.open();
    const doc = await this.getEntry(uuid, user);
    const hasRight = validateMethods.isOwner(doc.$owners, user);
    if (!hasRight) {
      throw new CouchError(
        'unauthorized to edit group (only owner can)',
        'unauthorized',
      );
    }
    return this._db.updateWithHandler(update, uuid, updateBody);
  },

  async insertEntry(entry, user, options) {
    debug(
      'insertEntry (id: %s, user: %s, options: %o)',
      entry._id,
      user,
      options,
    );
    await this.open();

    options = options || {};
    if (!entry.$content) throw new CouchError('entry has no content');
    if (options.groups !== undefined && !Array.isArray(options.groups)) {
      throw new CouchError(
        'options.groups should be an array if defined',
        'invalid argument',
      );
    }

    if (entry._id && options.isNew) {
      debug.trace('new entry has _id');
      throw new CouchError('entry should not have _id', 'bad argument');
    }

    const createIfNotFound = onNotFound(this, entry, user, options);

    let result;
    let action = 'updated';
    if (entry._id) {
      try {
        const doc = await this.getEntryWithRights(entry._id, user, ['write'], {
          token: options.token,
        });
        result = await updateEntry(this, doc, entry, user, options);
      } catch (e) {
        await createIfNotFound(e);
      }
    } else if (entry.$id) {
      debug.trace('entry has no _id but has $id: %o', entry.$id);
      if (options.isUpdate) {
        throw new CouchError(
          'Document must have an _id to be updated',
          'not found',
        );
      }
      result = await createNew(this, entry, user, options);
      action = 'created';
    } else {
      debug.trace('entry has no _id nor $id');
      if (options.isUpdate) {
        throw new CouchError(
          'entry should have an _id for update or a $id for creation',
          'bad argument',
        );
      }

      const res = await createNew(this, entry, user, options);
      action = 'created';
      result = res;
    }

    return { info: result, action };
  },
};

function onNotFound(ctx, entry, user, options) {
  return async (error) => {
    if (error.reason === 'not found') {
      debug.trace('doc not found');
      if (options.isUpdate) {
        throw new CouchError('Document does not exist', 'not found');
      }

      const res = await createNew(ctx, entry, user, options);
      return res;
    } else {
      throw error;
    }
  };
}

const createNew = lockify(_createNew, (ctx, entry) => {
  return JSON.stringify(entry.$id);
});

async function _createNew(ctx, entry, user, options) {
  debug.trace('create new');

  const hasGroups = options.groups ? options.groups.length > 0 : false;
  const rights = hasGroups ? ['create', 'owner'] : ['create'];
  user = validateMethods.userFromTokenAndRights(user, options.token, rights);

  if (!(await validateMethods.checkGlobalRight(ctx, user, 'create'))) {
    let msg = `${user} not allowed to create${
      hasGroups ? ' with groups (must be owner)' : ''
    }`;
    debug.trace(msg);
    throw new CouchError(msg, 'unauthorized');
  }

  // At this point, $id could be null or undefined
  // Exceptionally in that case, no unicity is enforced
  // We keep this behavior for backward compatibility
  // If $id is undefined, it is going to be replaced with null when the entry is saved
  if (entry.$id != null) {
    if (await getUniqueEntryById(ctx, user, entry.$id)) {
      throw new CouchError('entry already exists', 'conflict');
    }
  }

  const userSet = new Set(options.groups || []);

  // user is special because it needs to be the first owner
  userSet.delete(user);
  debug.trace('has right, create new');
  const newEntry = {
    $type: 'entry',
    $id: entry.$id,
    $kind: entry.$kind,
    $owners: [user].concat(Array.from(userSet)),
    $content: entry.$content,
    _attachments: entry._attachments,
  };
  const beforeCreateHook = getGlobalConfig().beforeCreateHook;
  if (beforeCreateHook) {
    const allGroups = await ctx._db.queryView(
      'documentByType',
      { key: 'group', include_docs: true },
      { onlyDoc: true },
    );
    try {
      const proxy = new Proxy(newEntry, alterEntryProxyHandler);
      await beforeCreateHook(proxy, allGroups);
    } catch (e) {
      e.message = `failed during call to beforeCreateHook: ${e.message}`;
      throw e;
    }
  }
  return nanoMethods.saveEntry(ctx._db, newEntry, user);
}

async function updateEntry(ctx, oldDoc, newDoc, user, options) {
  debug.trace('update entry');
  if (oldDoc._rev !== newDoc._rev) {
    debug.trace('document and entry _rev differ');
    throw new CouchError('document and entry _rev differ', 'conflict');
  }
  if (options.merge) {
    for (let key in newDoc.$content) {
      oldDoc.$content[key] = newDoc.$content[key];
    }
  } else {
    oldDoc.$content = newDoc.$content;
  }
  if (newDoc._attachments) {
    oldDoc._attachments = newDoc._attachments;
  }
  for (let key in newDoc) {
    if (util.isAllowedFirstLevelKey(key)) {
      oldDoc[key] = newDoc[key];
    }
  }
  // Doc validation will fail $kind changed
  oldDoc.$kind = newDoc.$kind;
  const res = await nanoMethods.saveEntry(ctx._db, oldDoc, user);
  if (options.groups) {
    await ctx.addOwnersToDoc(res.id, user, options.groups, 'entry');
  }
  return res;
}

// Resolves with an entry if this ID is already in the DB given the current entryUnicity option.
async function getUniqueEntryById(ctx, user, id) {
  let result;
  if (ctx[kEntryUnicity] === 'byOwner') {
    result = await ctx._db.queryView(
      'entryByOwnerAndId',
      {
        key: [user, id],
        reduce: false,
        include_docs: true,
      },
      {
        onlyDoc: true,
      },
    );
  } else if (ctx[kEntryUnicity] === 'global') {
    result = await ctx._db.queryView(
      'entryById',
      {
        key: id,
        reduce: false,
        include_docs: true,
      },
      {
        onlyDoc: true,
      },
    );
  } else {
    throw new Error(`wrong entryUnicity value: ${ctx[kEntryUnicity]}`);
  }
  if (result.length > 1) {
    throw new CouchError('entry is not unique');
  }
  return result[0];
}

async function getUniqueEntryByIdOrFail(ctx, user, id) {
  const doc = await getUniqueEntryById(ctx, user, id);
  if (!doc) {
    throw new CouchError('document not found', 'not found');
  }
  return doc;
}

module.exports = {
  methods,
};

function lockify(fun, getKey) {
  // contains ref to ongoing promises
  const lockMap = new Map();

  // Counts ongoing promises
  const lockMapCount = new Map();

  function decrement(mapKey) {
    if (lockMapCount.has(mapKey)) {
      const newCount = lockMapCount.get(mapKey) - 1;
      if (newCount === 0) {
        lockMapCount.delete(mapKey);
        lockMap.delete(mapKey);
      } else {
        lockMapCount.set(mapKey, newCount);
      }
    }
  }

  function increment(mapKey, promise) {
    lockMap.set(mapKey, promise);
    const newCount = lockMapCount.has(mapKey)
      ? lockMapCount.get(mapKey) + 1
      : 1;
    if (newCount > 2) {
      debug(`potential issue with deadlocked promise on key ${mapKey}`);
    }
    lockMapCount.set(mapKey, newCount);
  }

  return (...params) => {
    const keyStr = getKey(...params);

    let lock = lockMap.has(keyStr) ? lockMap.get(keyStr) : Promise.resolve();
    const result = lock
      .then(() => fun(...params))
      .finally(() => {
        decrement(keyStr);
      });

    lock = result.catch(() => {
      // Ignore error at the lock level. It must be handled by the user of the lockified function.
    });

    increment(keyStr, lock);

    return result;
  };
}

const alterEntryProxyHandler = {
  get(target, prop) {
    switch (prop) {
      case '$content':
        return target.$content;
      case '$owners':
        return new Proxy(target.$owners, alterOwnersProxyHandler);
      default:
        throw new Error(`altering ${prop} is not allowed`);
    }
  },
};

const allowedMethods = [
  'map',
  'findIndex',
  'find',
  'filter',
  'every',
  'includes',
  'some',
  'reduce',
  'forEach',
  'push',
];
const alterOwnersProxyHandler = {
  get(target, prop) {
    const value = target[prop];
    if (typeof value === 'function') {
      if (!allowedMethods.includes(prop)) {
        throw new Error(`You cannot use ${prop}`);
      }
    }
    return target[prop];
  },
  set(target, prop, value) {
    if (prop === '0') {
      throw new Error(
        `You cannot set the first element of $owners (primary user)`,
      );
    }

    if (!util.isValidOwner(value)) {
      throw new Error(`${value} is not a valid owner`);
    }
    target[prop] = value;
    return true;
  },
};
