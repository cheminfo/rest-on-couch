'use strict';

const objHash = require('object-hash');

const connect = require('../connect');
const constants = require('../constants');
const getDesignDoc = require('../design/app');
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:init');

const nanoMethods = require('./nano');
const util = require('./util');

const methods = {
  async open() {
    const _nano = await connect.open();
    if (this._nano !== _nano) {
      this._nano = _nano;
      this._db = this._nano.useDb(this._databaseName);
    }

    if (this._initPromise) {
      return this._initPromise;
    }
    this._initPromise = this.getInitPromise();
    return this._initPromise;
  },

  close() {
    return connect.close();
  },

  async getInitPromise() {
    debug('initialize db %s', this._databaseName);
    const db = await this._nano.hasDatabase(this._databaseName);
    if (!db) {
      debug('db not found: %s', this._databaseName);
      throw new CouchError(
        `database ${this._databaseName} does not exist`,
        'not found',
      );
    }
    // Must be done before the other checks because they can add documents to the db
    await checkSecurity(this._db, this._couchOptions.username);

    const updateDocsSettled = await Promise.allSettled([
      initDesignDocs(this),
      initRightsDoc(this._db, this._rights),
      initDefaultGroupsDoc(this._db),
    ]);

    if (
      updateDocsSettled.some((settled) =>
        settled.reason?.message?.includes?.('Document update conflict'),
      )
    ) {
      // Conflict in case of multiple roc instances checking the design doc at the same time.
      this._initPromise = null;
    }

    for (let settled of updateDocsSettled) {
      if (settled.status === 'rejected') {
        debug.error(
          'error while initializing design docs, rights and default groups ',
          settled.reason,
        );
      }
    }

    const migrationsSettled = await Promise.allSettled([
      migrateGroups(this._db),
    ]);
    for (let migration of migrationsSettled) {
      if (migration.status === 'rejected') {
        debug.error('migration error', migration.reason);
      }
    }

    if (this._couchOptions.ldapSync) {
      startLDAPSync(this);
    }
  },
};

async function startLDAPSync(db) {
  await tryLDAPSync(db);
  setInterval(async () => {
    await tryLDAPSync(db);
  }, 1000 * db._couchOptions.ldapGroupsRenewal);
}

async function tryLDAPSync(db) {
  try {
    await db.syncGroups();
  } catch (e) {
    debug.error('LDAP sync failed initialization', e);
  }
}

async function checkSecurity(db, admin) {
  debug.trace('check security');
  const security = await db.getDocument('_security');
  if (!security.admins || !security.admins.names.includes(admin)) {
    throw new CouchError(`${admin} is not an admin of ${db.dbName}`, 'fatal');
  }
}

async function initDesignDocs(couch) {
  const db = couch._db;
  const { dbName } = db;
  debug.trace('check design documents for database %s', dbName);
  var custom = couch._customDesign;
  custom.views = custom.views || {};
  custom.indexes = custom.indexes || {};
  const designNames = new Set();
  designNames.add(constants.DESIGN_DOC_NAME);
  const viewNames = Object.keys(custom.views);
  const indexNames = Object.keys(custom.indexes);
  for (let key of viewNames) {
    if (custom.views[key].designDoc) {
      designNames.add(custom.views[key].designDoc);
    }
  }

  const indexDesignNames = new Set();
  for (let key of indexNames) {
    indexDesignNames.add(custom.indexes[key].ddoc);
  }

  for (let designName of designNames) {
    // Create the new design doc that would be stored upstream for comparison
    const newDesignDoc = getNewDesignDoc(designName);
    const oldDesignDoc = await db.getDocument(`_design/${designName}`);
    if (designDocNeedsUpdate(newDesignDoc, oldDesignDoc)) {
      debug.trace(
        'design doc %s needs update, saving new revision',
        designName,
      );
      await createDesignDoc(
        db,
        (oldDesignDoc && oldDesignDoc._rev) || null,
        newDesignDoc,
      );
    }
  }

  // Create new indexes
  for (let indexName of Object.keys(custom.indexes)) {
    const index = custom.indexes[indexName];
    index.name = indexName;
    await db.createIndex(index);
  }

  // Delete orphan indexes
  const allDesignDocs = await db.getDesignDocs();
  for (let designDoc of allDesignDocs) {
    if (designDoc.language === 'query') {
      // if design doc is not referenced, delete the whole design document
      if (!indexDesignNames.has(designDoc._id.replace(/^_design\//, ''))) {
        debug.warn('destroy design doc', designDoc._id);
        await db.destroyDocument(designDoc._id, designDoc._rev);
      } else {
        for (let key of Object.keys(designDoc.views)) {
          if (!custom.indexes[key]) {
            await db.deleteIndex(designDoc._id, key);
          }
        }
      }
    }
  }

  function designDocNeedsUpdate(newDesignDoc, oldDesignDoc) {
    if (!oldDesignDoc) return true;
    return newDesignDoc.hash !== oldDesignDoc.hash;
  }

  // Generates design document from customViews config
  function getNewDesignDoc(designName) {
    var designDoc;
    if (designName === constants.DESIGN_DOC_NAME) {
      designDoc = { ...custom };
    } else {
      designDoc = {};
    }
    designDoc.views = {};
    designDoc.designDoc = designName;
    for (var i = 0; i < viewNames.length; i++) {
      var viewName = viewNames[i];
      if (custom.views[viewName].designDoc === designName) {
        designDoc.views[viewName] = custom.views[viewName];
      } else if (
        !custom.views[viewName].designDoc &&
        designName === constants.DESIGN_DOC_NAME
      ) {
        designDoc.views[viewName] = custom.views[viewName];
      }
    }
    designDoc._id = `_design/${designName}`;
    designDoc = getDesignDoc(designDoc, dbName);
    designDoc.hash = objHash(designDoc);
    return designDoc;
  }
}

function createDesignDoc(db, revID, designDoc) {
  debug.trace('create design doc');
  const hashDoc = { ...designDoc };
  delete hashDoc._rev;
  delete hashDoc.hash;
  const hash = objHash(hashDoc);
  designDoc.hash = hash;
  if (revID) {
    designDoc._rev = revID;
  }
  return db.insertDocument(designDoc);
}

async function initRightsDoc(db, rights) {
  debug.trace('check rights doc');
  const doc = await db.getDocument(constants.RIGHTS_DOC_ID);
  if (doc === null) {
    debug.trace('rights doc does not exist');
    return createRightsDoc(db, rights);
  }
  return true;
}

function createRightsDoc(db, rightsDoc) {
  return db.insertDocument(rightsDoc);
}

async function initDefaultGroupsDoc(db) {
  debug.trace('check defaultGroups doc');
  const doc = await db.getDocument(constants.DEFAULT_GROUPS_DOC_ID);
  if (doc === null) {
    debug.trace('defaultGroups doc does not exist');
    return db.insertDocument({
      _id: constants.DEFAULT_GROUPS_DOC_ID,
      $type: 'db',
      anonymous: [],
      anyuser: [],
    });
  }
  return true;
}

async function migrateGroups(db) {
  debug.trace('migrate groups');
  const groups = await db.queryView(
    'documentByType',
    {
      key: 'group',
      include_docs: true,
    },
    { onlyDoc: true },
  );
  for (let group of groups) {
    if (!group.groupType) {
      // already migrated
      continue;
    }
    // The property no longer serves any purpose since rest-on-couch v12
    // The group type is inferred from the DN and filter properties
    delete group.groupType;
    if (!util.isLdapGroup(group)) {
      // All in users are custom users
      group.customUsers = group.users;
    }
    await nanoMethods.save(db, group, 'ldap');
    debug('migrated group %s', group.name);
  }
}

module.exports = {
  methods,
};
