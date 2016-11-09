'use strict';

const _ = require('lodash');
const includes = require('array-includes');
const nano = require('nano');
const objHash = require('object-hash');

const getDesignDoc = require('../design/app');

const constants = require('../constants');
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:init');
const nanoPromise = require('../util/nanoPromise');

const methods = {
    async open() {
        if (this._initPromise) {
            return this._initPromise;
        }
        return this._initPromise = this.getInitPromise();
    },

    close() {
        clearInterval(this._authRenewal);
    },

    async getInitPromise() {
        debug(`initialize db ${this._databaseName}`);
        await this._authenticate();
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
        this._renewAuthentication();
    },

    _renewAuthentication() {
        if (this._authRenewal) {
            clearInterval(this._authRenewal);
        }
        this._authRenewal = setInterval(() => {
            this._currentAuth = this.getAuthenticationPromise();
        }, this._authRenewalInterval * 1000);
    },

    _authenticate() {
        if (this._currentAuth) {
            return this._currentAuth;
        }
        return this._currentAuth = this.getAuthenticationPromise();
    },

    async getAuthenticationPromise() {
        if (this._couchOptions.username) {
            debug.trace('authenticate to CouchDB');
            const cookie = await nanoPromise.authenticate(
                this._nano,
                this._couchOptions.username,
                this._couchOptions.password
            );
            this._nano = nano({
                url: this._couchOptions.url,
                cookie
            });
        } else {
            throw new CouchError('rest-on-couch cannot be used without credentials', 'fatal');
        }
        this._db = this._nano.db.use(this._databaseName);
    }
};

async function checkSecurity(db, admin) {
    debug.trace('check security');
    const security = await nanoPromise.getDocument(db, '_security');
    if (!security.admins || !includes(security.admins.names, admin)) {
        throw new CouchError(`${admin} is not an admin of ${db.config.db}`, 'fatal');
    }
}

async function checkDesignDoc(couch) {
    var db = couch._db;
    var custom = couch._customDesign;
    custom.views = custom.views || {};
    var toUpdate = new Set();
    debug.trace('check _design/app design doc');
    const doc = await nanoPromise.getDocument(db, constants.DESIGN_DOC_ID);
    if (doc === null) {
        toUpdate.add(constants.DESIGN_DOC_NAME);
        debug.trace(`${constants.DESIGN_DOC_ID} missing`);
    } else if (
        (!doc.version || doc.version < constants.DESIGN_DOC_VERSION) ||
        (custom && typeof custom.version === 'number' && (!doc.customVersion || doc.customVersion < custom.version))
    ) {
        debug.trace(`${constants.DESIGN_DOC_ID} needs update`);
        toUpdate.add(constants.DESIGN_DOC_NAME);
    }

    debug.trace('check other custom design docs');
    var viewNames = Object.keys(custom.views);
    if (viewNames.indexOf(constants.DESIGN_DOC_NAME) > -1) {
        let idx = viewNames.indexOf(constants.DESIGN_DOC_NAME);
        viewNames.splice(idx, 1);
    }
    var designNames = viewNames.map(vn => custom.views[vn].designDoc);
    var uniqDesignNames = _.uniq(designNames);
    uniqDesignNames = uniqDesignNames.filter(d => d && d !== constants.DESIGN_DOC_NAME);
    var designDocs = await Promise.all(uniqDesignNames.map(name => nanoPromise.getDocument(db, `_design/${name}`)));
    uniqDesignNames.push(constants.DESIGN_DOC_NAME);
    designDocs.push(doc);

    for (var i = 0; i < viewNames.length; i++) {
        let view = custom.views[viewNames[i]];
        var hash = objHash(view);
        var dbView = getDBView(viewNames[i]);
        if (!dbView) {
            if (view.designDoc) {
                debug.trace(`design doc ${view.designDoc} not found, will create it`);
                toUpdate.add(view.designDoc);
            }
        } else {

            if (dbView.hash !== hash) {
                if (view.designDoc) {
                    debug.trace(`design doc ${view.designDoc} changed, will update it`);
                    toUpdate.add(view.designDoc);
                }
            }
        }
        view.hash = hash;
    }

    debug.trace(`Update ${toUpdate.size} design documents`);
    for (var designName of toUpdate.keys()) {
        var idx = uniqDesignNames.indexOf(designName);
        if (idx > -1 || designName === constants.DESIGN_DOC_NAME) {
            var newDesignDoc = getNewDesignDoc(designName);
            await createDesignDoc(db, designDocs[idx] && designDocs[idx]._rev || null, newDesignDoc);
            if (newDesignDoc.views) {
                var keys = Object.keys(newDesignDoc.views).filter(v => v !== 'lib');
                if (keys.length) {
                    await nanoPromise.queryView(db, keys[0], {limit: 1});
                }
            }

        } else {
            debug.error('Expected to be unreachable');
        }
    }

    function getDBView(viewName) {
        for (var i = 0; i < designDocs.length; i++) {
            if (designDocs[i] && designDocs[i].views && designDocs[i].views[viewName]) {
                return designDocs[i].views[viewName];
            }
        }
        return null;
    }

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
        designDoc._id =  '_design/' + designName;
        return designDoc;
    }
}

async function createDesignDoc(db, revID, custom) {
    debug.trace('create design doc');
    var designDoc = getDesignDoc(custom, db.config.db);
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
