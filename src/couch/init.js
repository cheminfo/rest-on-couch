'use strict';

const objHash = require('object-hash');

const getDesignDoc = require('../design/app');

const connect = require('../connect');
const constants = require('../constants');
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:init');
const nanoPromise = require('../util/nanoPromise');

const methods = {
    async open() {
        const _nano = await connect.open();
        if(this._nano !== _nano) {
            this._nano = _nano;
            this._db = this._nano.db.use(this._databaseName);
        }

        if (this._initPromise) {
            return this._initPromise;
        }
        return this._initPromise = this.getInitPromise();
    },

    close() {
        return connect.close();
    },

    async getInitPromise() {
        debug(`initialize db ${this._databaseName}`);
        const db = await nanoPromise.getDatabase(this._nano, this._databaseName);
        if (!db) {
            if (this._couchOptions.autoCreate) {
                debug.trace('db not found -> create');
                await nanoPromise.createDatabase(this._nano, this._databaseName);
                await nanoPromise.request(this._nano, {
                    method: 'PUT',
                    db: this._databaseName,
                    doc: '_security',
                    body: {
                        admins: {
                            names: [this._couchOptions.username],
                            roles: []
                        },
                        members: {
                            names: [this._couchOptions.username],
                            roles: []
                        }
                    }
                });
            } else {
                debug('db not found - autoCreate is false');
                throw new CouchError(`database ${this._databaseName} does not exist`, 'not found');
            }
        }
        // Must be done before the other checks because they can add documents to the db
        await checkSecurity(this._db, this._couchOptions.username);

        await Promise.all([
            checkDesignDoc(this),
            checkRightsDoc(this._db, this._rights),
            checkDefaultGroupsDoc(this._db)
        ]);
    }
};

async function checkSecurity(db, admin) {
    debug.trace('check security');
    const security = await nanoPromise.getDocument(db, '_security');
    if (!security.admins || !security.admins.names.includes(admin)) {
        throw new CouchError(`${admin} is not an admin of ${db.config.db}`, 'fatal');
    }
}

async function checkDesignDoc(couch) {
    const db = couch._db;
    const dbName = db.config.db;
    debug.trace(`check design documents for database ${dbName}`);
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
        const oldDesignDoc = await nanoPromise.getDocument(db, `_design/${designName}`);
        if (designDocNeedsUpdate(newDesignDoc, oldDesignDoc)) {
            debug.trace(`design doc ${designName} needs update, saving new revision`);
            await createDesignDoc(db, oldDesignDoc && oldDesignDoc._rev || null, newDesignDoc);
        }
    }

    function designDocNeedsUpdate(newDesignDoc, oldDesignDoc) {
        if (!oldDesignDoc) return true;
        return newDesignDoc.hash !== oldDesignDoc.hash;
    }

    // Generates design document from customViews config
    function getNewDesignDoc(designName) {
        if (designName === constants.DESIGN_DOC_NAME) {
            var designDoc = Object.assign({}, custom);
        } else {
            designDoc = {};
        }
        designDoc.views = {};
        designDoc.designDoc = designName;
        for (var i = 0; i < viewNames.length; i++) {
            var viewName = viewNames[i];
            if (custom.views[viewName].designDoc === designName) {
                designDoc.views[viewName] = custom.views[viewName];
            } else if (!custom.views[viewName].designDoc && designName === constants.DESIGN_DOC_NAME) {
                designDoc.views[viewName] = custom.views[viewName];
            }
        }
        designDoc._id = `_design/${designName}`;
        designDoc = getDesignDoc(designDoc, dbName);
        designDoc.hash = objHash(designDoc);
        return designDoc;
    }
}

async function createDesignDoc(db, revID, designDoc) {
    debug.trace('create design doc');
    const hashDoc = Object.assign({}, designDoc);
    delete hashDoc._rev;
    delete hashDoc.hash;
    const hash = objHash(hashDoc);
    designDoc.hash = hash;
    if (revID) {
        designDoc._rev = revID;
    }
    return nanoPromise.insertDocument(db, designDoc);
}

async function checkRightsDoc(db, rights) {
    debug.trace('check rights doc');
    const doc = await nanoPromise.getDocument(db, constants.RIGHTS_DOC_ID);
    if (doc === null) {
        debug.trace('rights doc does not exist');
        return createRightsDoc(db, rights);
    }
    return true;
}

async function createRightsDoc(db, rightsDoc) {
    return nanoPromise.insertDocument(db, rightsDoc);
}

async function checkDefaultGroupsDoc(db) {
    debug.trace('check defaultGroups doc');
    const doc = await nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID);
    if (doc === null) {
        debug.trace('defaultGroups doc does not exist');
        return nanoPromise.insertDocument(db, {
            _id: constants.DEFAULT_GROUPS_DOC_ID,
            $type: 'db',
            anonymous: [],
            anyuser: []
        });
    }
    return true;
}

module.exports = {
    methods
};
