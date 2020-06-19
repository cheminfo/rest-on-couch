'use strict';

const objHash = require('object-hash');

const connect = require('../connect');
const constants = require('../constants');
const getDesignDoc = require('../design/app');
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:init');

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

    const updateDocs = Promise.all([
      checkDesignDoc(this),
      checkRightsDoc(this._db, this._rights),
      checkDefaultGroupsDoc(this._db),
    ]);

    updateDocs.catch((e) => {
      if (e.message.includes('Document update conflict')) {
        // Conflict in case of multiple roc instances checking the design doc at the same time.
        this._initPromise = null;
      }
    });

    await updateDocs;

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
    await db.syncLDAPGroups();
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

async function checkDesignDoc(couch) {
  const db = couch._db;
  const { dbName } = db;
  debug.trace('check design documents for database %s', dbName);
  var custom = couch._customDesign;
  custom.views = custom.views || {};
  const designNames = new Set();
  designNames.add(constants.DESIGN_DOC_NAME);
  let viewNames = Object.keys(custom.views);
  for (let key of viewNames) {
    if (custom.views[key].designDoc) {
      designNames.add(custom.views[key].designDoc);
    }
  }

  // Create the new design doc that would be stored upstream for comparison
  for (let designName of designNames) {
    const newDesignDoc = getNewDesignDoc(designName);
    // eslint-disable-next-line no-await-in-loop
    const oldDesignDoc = await db.getDocument(`_design/${designName}`);
    if (designDocNeedsUpdate(newDesignDoc, oldDesignDoc)) {
      debug.trace(
        'design doc %s needs update, saving new revision',
        designName,
      );
      // eslint-disable-next-line no-await-in-loop
      await createDesignDoc(
        db,
        (oldDesignDoc && oldDesignDoc._rev) || null,
        newDesignDoc,
      );
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
      designDoc = Object.assign({}, custom);
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
  const hashDoc = Object.assign({}, designDoc);
  delete hashDoc._rev;
  delete hashDoc.hash;
  const hash = objHash(hashDoc);
  designDoc.hash = hash;
  if (revID) {
    designDoc._rev = revID;
  }
  return db.insertDocument(designDoc);
}

async function checkRightsDoc(db, rights) {
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

async function checkDefaultGroupsDoc(db) {
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

module.exports = {
  methods,
};
