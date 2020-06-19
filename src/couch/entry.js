'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:entry');
const ensureStringArray = require('../util/ensureStringArray');
const kEntryUnicity = require('../constants').kEntryUnicity;

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

    debug.trace('check rights');
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

  // this function can only return an entry for its primary owner
  async getEntryById(id, user, options) {
    await this.open();
    debug('getEntryById (%s, %s)', id, user);
    const uuid = await this.getDocUuidFromId(id, user, 'entry');
    return this.getDocByRights(uuid, user, 'owner', 'entry', options);
  },

  async deleteEntry(uuid, user) {
    debug('deleteEntry (%s, %s)', uuid, user);
    const entry = await this.getEntryWithRights(uuid, user, 'delete');
    entry._deleted = true;
    return nanoMethods.saveEntry(this._db, entry, user);
  },

  // Create entry if does not exist
  async createEntry(id, user, options) {
    options = options || {};
    debug('createEntry (id: %s, user: %s, kind: %s)', id, user, options.kind);
    await this.open();
    const result = await getUniqueEntryById(this, user, id);

    if (result === undefined) {
      const hasRight = await validateMethods.checkRightAnyGroup(
        this,
        user,
        'create',
      );
      if (!hasRight) {
        throw new CouchError('user is missing create right', 'unauthorized');
      }
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
        $type: 'entry',
        $owners: [user].concat(owners),
        $content: entry,
        $kind: options.kind,
      };
      return nanoMethods.saveEntry(this._db, toInsert, user);
    }
    debug.trace('entry already exists');
    if (options.throwIfExists) {
      throw new CouchError('entry already exists', 'conflict');
    }
    // Return something similar to insertDocument
    return {
      ok: true,
      id: result.doc._id,
      rev: result.doc._rev,
      $modificationDate: result.doc.$modificationDate,
      $creationDate: result.doc.$creationDate,
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

    const notFound = onNotFound(this, entry, user, options);

    let result;
    let action = 'updated';
    if (entry._id) {
      try {
        const doc = await this.getEntryWithRights(entry._id, user, ['write']);
        result = await updateEntry(this, doc, entry, user, options);
      } catch (e) {
        if (e.reason === 'not found') {
          result = await notFound(e);
          action = 'created';
        } else {
          throw e;
        }
      }
    } else if (entry.$id) {
      debug.trace('entry has no _id but has $id: %o', entry.$id);
      if (await getUniqueEntryById(this, user, entry.$id)) {
        throw new CouchError('entry already exists', 'conflict');
      } else {
        result = await notFound({ reason: 'not found' });
        action = 'created';
      }
    } else {
      debug.trace('entry has no _id nor $id');
      if (options.isUpdate) {
        throw new CouchError('entry should have an _id', 'bad argument');
      }
      const res = await createNew(this, entry, user);
      action = 'created';
      if (options.groups) {
        await this.addOwnersToDoc(res.id, user, options.groups, 'entry');
      }
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

      const res = await createNew(ctx, entry, user);
      if (options.groups) {
        await ctx.addOwnersToDoc(res.id, user, options.groups, 'entry');
      }
      return res;
    } else {
      throw error;
    }
  };
}

async function createNew(ctx, entry, user) {
  debug.trace('create new');
  const ok = await validateMethods.checkGlobalRight(ctx, user, 'create');
  if (ok) {
    debug.trace('has right, create new');
    const newEntry = {
      $type: 'entry',
      $id: entry.$id,
      $kind: entry.$kind,
      $owners: [user],
      $content: entry.$content,
      _attachments: entry._attachments,
    };
    return nanoMethods.saveEntry(ctx._db, newEntry, user);
  } else {
    let msg = `${user} not allowed to create`;
    debug.trace(msg);
    throw new CouchError(msg, 'unauthorized');
  }
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
    result = await ctx._db.queryView('entryByOwnerAndId', {
      key: [user, id],
      reduce: false,
      include_docs: true,
    });
  } else if (ctx[kEntryUnicity] === 'global') {
    result = await ctx._db.queryView('entryById', {
      key: id,
      reduce: false,
      include_docs: true,
    });
  } else {
    throw new Error(`wrong entryUnicity value: ${ctx[kEntryUnicity]}`);
  }
  return result[0];
}

module.exports = {
  methods,
};
