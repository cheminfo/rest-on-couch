'use strict';

const debug = require('./util/debug')('main');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getDesignDoc = require('./design/app');
const nanoPromise = require('./util/nanoPromise');
const log = require('./couch/log');
const getConfig = require('./config/config').getConfig;
const co = require('co');
const globalRightTypes = ['read', 'write', 'create', 'createGroup'];
const isEmail = require('./util/isEmail');

const basicRights = {
    $type: 'db',
    _id: constants.RIGHTS_DOC_ID,
    createGroup: [],
    create: [],
    read: []
};

const defaultRights = {
    read: ['anonymous']
};

class Couch {
    constructor(options) {
        let database;
        if (typeof options === 'string') {
            database = options;
        } else if (options != null) {
            database = options.database;
        }

        if (!database) {
            throw new CouchError('database option is mandatory');
        }

        this._databaseName = database;

        const config = getConfig(database, options);

        this._couchOptions = {
            url: config.url,
            database,
            username: config.username,
            password: config.password
        };

        this._logLevel = log.getLevel(config.logLevel);

        this._customDesign = config.customDesign || {};
        this._defaultEntry = config.defaultEntry || getDefaultEntry;
        this._rights = Object.assign({}, basicRights, config.rights || defaultRights);

        this._nano = nano(this._couchOptions.url);
        this._db = null;
        this._lastAuth = 0;
        this._currentAuth = null;
        this._initPromise = null;
        this._init();
    }

    _init() {
        if (this._initPromise) {
            return this._initPromise;
        }
        debug(`initialize db ${this._couchOptions.database}`);
        return this._initPromise = this._authenticate()
            .then(() => nanoPromise.getDatabase(this._nano, this._couchOptions.database))
            .then(db => {
                if (!db) {
                    debug.trace('db not found -> create');
                    return nanoPromise.createDatabase(this._nano, this._couchOptions.database);
                }
            })
            .then(() => checkDesignDoc(this._db, this._customDesign))
            .then(() => checkRightsDoc(this._db, this._rights))
            .then(() => checkDefaultGroupsDoc(this._db));
    }

    _authenticate() {
        if (this._currentAuth) {
            return this._currentAuth;
        }
        let prom = Promise.resolve();
        if (this._couchOptions.username) {
            debug.trace('authenticate to CouchDB');
            prom = nanoPromise.authenticate(
                this._nano,
                this._couchOptions.username,
                this._couchOptions.password
            ).then(cookie => {
                this._nano = nano({
                    url: this._couchOptions.url,
                    cookie
                });
            });
        } else {
            debug.warn('no user provided, continue assuming admin party');
        }
        return this._currentAuth = prom.then(() => {
            this._db = this._nano.db.use(this._couchOptions.database);
        });
    }

    editUser(user, data) {
        return this.getUser(user).then(doc => {
            if (!doc) doc = {};
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    doc[key] = data[key];
                }
            }
            doc.$type = 'user';
            doc.user = user;
            return nanoPromise.insertDocument(this._db, doc);
        });
    }

    getUser(user) {
        return getUser(this._db, user);
    }

    createEntry(id, user, options) {
        options = options || {};
        debug(`createEntry (id: ${id}, user: ${user}, kind: ${options.kind})`);
        return this._init()
            .then(() => checkRightAnyGroup(this._db, user, 'create'))
            .then(hasRight => {
                if (!hasRight) {
                    debug.trace(`user ${user} is missing create right`);
                    throw new CouchError('user is missing create right', 'unauthorized');
                }
                return nanoPromise.queryView(this._db, 'entryById', {key: id})
                    .then(result => {
                        if (result.length === 0) {
                            let newEntry;
                            const defaultEntry = this._defaultEntry;
                            if (typeof defaultEntry === 'function') {
                                newEntry = defaultEntry.apply(null, options.createParameters || []);
                            } else if (typeof defaultEntry[options.kind] === 'function') {
                                newEntry = defaultEntry[options.kind].apply(null, options.createParameters || []);
                            } else {
                                throw new CouchError('unexpected type for default entry');
                            }
                            return Promise.resolve(newEntry)
                                .then(entry => {
                                    const toInsert = {
                                        $id: id,
                                        $type: 'entry',
                                        $owners: [user],
                                        $content: entry,
                                        $kind: options.kind
                                    };
                                    return saveEntry(this._db, toInsert, user);
                                });
                        }
                        debug.trace('entry already exists');
                        if (options.throwIfExists) {
                            throw new CouchError('entry already exists', 'exists');
                        }
                        // Return something similar to insertDocument
                        return {
                            ok: true,
                            id: result[0]._id,
                            rev: result[0]._rev
                        };
                    });
            });
    }

    /*
     Like queryViewByUser but only entries are returned
     Since custom design views might emit for non-entries we
     need to ensure those are not returned to non-admin users
     */
    queryEntriesByUser(user, view, options, rights) {
        return this.queryViewByUser(user, view, options, rights)
            .then(docs => docs.filter(doc => doc.$type === 'entry'));
    }

    queryViewByUser(user, view, options, rights) {
        var that = this;
        debug(`queryViewByUser (${user}, ${view})`);
        options = options || {};
        options.include_docs = true;
        options.reduce = false;
        options.skip = 0;
        var limit = options.limit || 1;

        return co(function * () {
            var cumRows = [];
            yield that._init();
            while (cumRows.length < limit) {
                let rows = yield nanoPromise.queryView(that._db, view, options);
                // No more results
                if (!rows.length) break;

                let owners = rows.map(r => r.doc.$owners);
                let hasRights = yield validateRights(that._db, owners, user, rights || 'read');
                rows = rows.map(entry => entry.doc);
                rows = rows.filter((r, idx) => hasRights[idx]);

                // Return everything
                if (!options.limit) return rows;

                // Concatenate
                limit = options.limit;
                options.skip += limit;
                cumRows = cumRows.concat(rows);
            }

            // Get rid of extra rows
            return cumRows.filter((r, idx) => idx < options.limit);
        });
    }

    getEntriesByUserAndRights(user, rights, options) {
        return this.queryViewByUser(user, 'entryById', options, rights);
    }

    getEntryByIdAndRights(id, user, rights) {
        debug(`getEntryByIdAndRights (${id}, ${user}, ${rights})`);
        return this._init()
            .then(() => getOwnersById(this._db, id))
            .then(owners => {
                if (owners.length === 0) {
                    debug.trace(`no entry matching id ${id}`);
                    throw new CouchError('document not found', 'not found');
                }
                let hisEntry = owners.find(own => own.value[0] === user);
                if (!hisEntry) {
                    hisEntry = owners[0];
                }
                return validateRights(this._db, hisEntry.value, user, rights)
                    .then(ok => {
                        if (ok[0]) {
                            debug.trace(`user ${user} has access`);
                            return nanoPromise.getDocument(this._db, hisEntry.id);
                        }
                        debug.trace(`user ${user} has no ${rights} access`);
                        throw new CouchError('user has no access', 'unauthorized');
                    });
            });
    }

    getEntryByUuidAndRights(uuid, user, rights) {
        debug(`getEntryByUuidAndRights (${uuid}, ${user}, ${rights})`);
        return this._init()
            .then(() => nanoPromise.getDocument(this._db, uuid))
            .then(doc => {
                if (!doc) {
                    debug.trace('document not found');
                    throw new CouchError('document not found', 'not found');
                }
                if (doc.$type !== 'entry') {
                    debug.trace('document is not an entry');
                    throw new CouchError('document is not an entry', 'not entry');
                }
                debug.trace('check rights');
                return validateRights(this._db, doc.$owners, user, rights)
                    .then(ok => {
                        if (ok[0]) {
                            debug.trace(`user ${user} has access`);
                            return doc;
                        }
                        debug.trace(`user ${user} has no ${rights} access`);
                        throw new CouchError('user has no access', 'unauthorized');
                    });
            });
    }

    getEntryByUuid(uuid, user) {
        return this.getEntryByUuidAndRights(uuid, user, 'read');
    }

    getEntryById(id, user) {
        return this.getEntryByIdAndRights(id, user, 'read');
    }

    _doUpdateOnEntry(id, user, update, updateBody) {
        // Call update handler
        return this._init()
            .then(() => this.getEntryById(id, user))
            .then(doc => {
                const hasRight = isOwner(doc.$owners, user);
                if (!hasRight) throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
                return nanoPromise.updateWithHandler(this._db, update, doc._id, updateBody);
            });
    }

    _doUpdateOnEntryByUuid(uuid, user, update, updateBody) {
        return this._init()
            .then(() => this.getEntryByUuid(uuid, user))
            .then(doc => {
                const hasRight = isOwner(doc.$owners, user);
                if (!hasRight) throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
                return nanoPromise.updateWithHandler(this._db, update, uuid, updateBody);
            });
    }

    addAttachmentsById(id, user, attachments) {
        debug(`addAttachmentsById (${id}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        return this.getEntryByIdAndRights(id, user, ['write', 'addAttachment'])
            .then(entry => nanoPromise.attachFiles(this._db, entry, attachments));
    }

    addAttachmentsByUuid(uuid, user, attachments) {
        debug(`addAttachmentsByUuid (${uuid}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        return this.getEntryByUuidAndRights(uuid, user, ['write', 'addAttachment'])
            .then(entry => {
                return nanoPromise.attachFiles(this._db, entry, attachments);
            });
    }

    getAttachmentByIdAndName(id, name, user, asStream) {
        debug(`getAttachmentByIdAndName (${id}, ${name}, ${user})`);
        return this.getEntryById(id, user)
            .then(getAttachmentFromEntry(this, name, asStream));
    }

    getAttachmentByUuidAndName(uuid, name, user, asStream) {
        debug(`getAttachmentByUuidAndName (${uuid}, ${name}, ${user})`);
        return this.getEntryByUuid(uuid, user)
            .then(getAttachmentFromEntry(this, name, asStream));
    }

    addFileToJpath(id, user, jpath, json, file) {
        if (!Array.isArray(jpath)) {
            throw new CouchError('jpath must be an array');
        }
        if (typeof json !== 'object') {
            throw new CouchError('json must be an object');
        }
        if (typeof file !== 'object') {
            throw new CouchError('file must be an object');
        }
        if (!file.type || !file.name || !file.data) {
            throw new CouchError('file must have type, name and data properties');
        }
        return this.getEntryByIdAndRights(id, user, ['write'])
            .then(entry => {
                let current = entry.$content || {};
                for (var i = 0; i < jpath.length; i++) {
                    current = current[jpath[i]];
                    if (!current) {
                        throw new CouchError('jpath does not match document structure');
                    }
                }
                if (!Array.isArray(current)) {
                    throw new CouchError('jpath must point to an array');
                }

                // Find element(s) with the same file name and remove them
                let filenames = current.map(el => el.file.filename);
                let idx;
                while (( idx = filenames.findIndex(filename => filename === file.name) ) > -1) {
                    filenames.splice(idx, 1);
                    current.splice(idx, 1);
                }

                current.push(json);

                json.file = {
                    type: file.type,
                    filename: file.name
                };

                return nanoPromise.attachFiles(this._db, entry, [file])
                    .then(body => {
                        entry._rev = body.rev;
                        return this.insertEntry(entry, user);
                    });
            });
    }

    editGlobalRight(type, user, action) {
        if (action !== 'add' && action !== 'remove') {
            return Promise.reject(new CouchError('Edit global right invalid action', 'bad argument'));
        }
        let e;
        if (e = checkGlobalTypeAndUser(type, user)) {
            return Promise.reject(e);
        }

        return nanoPromise.getDocument(this._db, constants.RIGHTS_DOC_ID)
            .then(doc => {
                if (!doc) throw new Error('Rights document should always exist', 'unreachable');
                if (action === 'add') {
                    if (!doc[type]) doc[type] = [];
                    if (doc[type].indexOf(user) === -1) {
                        doc[type].push(user);
                    }
                }
                if (action === 'remove') {
                    if (doc[type]) {
                        const idx = doc[type].indexOf(user);
                        if (idx !== -1) {
                            doc[type].splice(idx, 1);
                        }
                    }
                }

                return nanoPromise.insertDocument(this._db, doc);
            });
    }

    addGlobalRight(type, user) {
        return this.editGlobalRight(type, user, 'add');
    }

    removeGlobalRight(type, user) {
        return this.editGlobalRight(type, user, 'remove');
    }

    editDefaultGroup(group, type, action) {
        if (action !== 'add' && action !== 'remove') {
            throw new CouchError('edit default group invalid action', 'bad argument');
        }
        if (!isSpecialUser(type)) {
            throw new CouchError('edit default group invalid type', 'bad argument');
        }
        if (!isValidGroupName(group)) {
            throw new CouchError('edit default group invalid group name', 'bad argument');
        }

        return nanoPromise.getDocument(this._db, constants.DEFAULT_GROUPS_DOC_ID)
            .then(doc => {
                if (!doc) throw new Error('default groups document should always exist', 'unreachable');
                if (action === 'add') {
                    if (!doc[type]) doc[type] = [];
                    if (doc[type].indexOf(group) === -1) {
                        doc[type].push(group);
                    }
                }
                if (action === 'remove') {
                    if (doc[type]) {
                        const idx = doc[type].indexOf(group);
                        if (idx !== -1) {
                            doc[type].splice(idx, 1);
                        }
                    }
                }

                return nanoPromise.insertDocument(this._db, doc);
            });
    }

    addDefaultGroup(group, type) {
        return this.editDefaultGroup(group, type, 'add');
    }

    removeDefaultGroup(group, type) {
        return this.editDefaultGroup(group, type, 'remove');
    }

    addGroupToEntry(id, user, group) {
        debug(`addGroupToEntry (${id}, ${user}, ${group})`);
        return this._doUpdateOnEntry(id, user, 'addGroupToEntry', {group});
    }

    addGroupToEntryByUuid(uuid, user, group) {
        debug(`addGroupToEntryByUuid (${uuid}, ${user}, ${group})`);
        return this._doUpdateOnEntryByUuid(uuid, user, 'addGroupToEntry', {group});
    }

    removeGroupFromEntry(id, user, group) {
        debug(`removeGroupFromEntry (${id}, ${user}, ${group})`);
        return this._doUpdateOnEntry(id, user, 'removeGroupFromEntry', {group: group});
    }

    deleteGroup(groupName, user) {
        debug(`deleteGroup (${groupName}, ${user})`);
        return this._init()
            .then(() => getGroup(this._db, groupName))
            .then(doc => {
                if (!doc) {
                    debug.trace('group does not exist');
                    throw new CouchError('group does not exist', 'not found');
                }
                if (!isOwner(doc.$owners, user)) {
                    debug.trace('not allowed to delete group');
                    throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
                }

                // TODO Change entries which have this group
                return nanoPromise.destroyDocument(this._db, doc._id);
            });
    }

    createGroup(groupName, user, rights) {
        debug(`createGroup ${groupName}, ${user}`);
        if (!Array.isArray(rights)) rights = ['read'];
        return this._init()
            .then(() => checkRightAnyGroup(this._db, user, 'createGroup'))
            .then(hasRight => {
                if (!hasRight) throw new CouchError(`user ${user} does not have createGroup right`);
            })
            .then(() => getGroup(this._db, groupName))
            .then(group => {
                if (group) throw new CouchError(`group ${groupName} already exists`, 'exists');
                return nanoPromise.insertDocument(this._db, {
                    $type: 'group',
                    $owners: [user],
                    name: groupName,
                    users: [],
                    rights: rights
                });
            });
    }

    insertEntry(entry, user, options) {
        debug(`insertEntry (id: ${entry._id}, user: ${user}, options: ${options})`);

        return this._init().then(() => {
            options = options || {};
            options.groups = options.groups || [];
            if (!entry.$content) throw new CouchError('entry has no content');
            if (options.groups !== undefined && !Array.isArray(options.groups)) throw new CouchError('options.groups should be an array if defined', 'invalid argument');

            let prom;

            if (entry._id && options.isNew) {
                debug.trace('new entry has _id');
                throw new CouchError('entry should not have _id', 'bad argument');
            }
            if (entry._id) {
                prom = this.getEntryByUuidAndRights(entry._id, user, ['write'])
                    .then(doc => {
                        return updateEntry(this, doc, entry, user, options);
                    }).catch(onNotFound(this, entry, user, options));
            } else if (entry.$id) {
                debug.trace('entry has no _id but has $id');
                prom = this.getEntryByIdAndRights(entry.$id, user, ['write'])
                    .then(doc => {
                        return updateEntry(this, doc, entry, user, options);
                    }).catch(onNotFound(this, entry, user, options));
            } else {
                debug.trace('entry has no _id nor $id');
                if (options.isUpdate) {
                    throw new CouchError('entry should have an _id', 'bad argument');
                }
                var res;
                prom = createNew(this, entry, user)
                    .then(r => res = r)
                    .then(addGroups(this, user, options.groups))
                    .then(() => res);
            }

            return prom;
        });

    }

    deleteEntryByUuid(uuid, user) {
        debug(`deleteEntryByUuid (${uuid}, ${user})`);
        return this.getEntryByUuidAndRights(uuid, user, 'delete')
            .then(() => nanoPromise.destroyDocument(this._db, uuid));
    }

    deleteEntryById(id, user) {
        debug(`deleteEntryById (${id}, ${user}`);
        return this.getEntryByIdAndRights(id, user, 'delete')
            .then(doc => nanoPromise.destroyDocument(this._db, doc._id));
    }

    log(message, level) {
        debug(`log (${message}, ${level})`);
        return this._init().then(() => log.log(this._db, this._logLevel, message, level));
    }

    getLogs(epoch) {
        debug(`getLogs (${epoch}`);
        return this._init().then(() => log.getLogs(this._db, epoch));
    }
}

const databaseCache = new Map();

Couch.get = function (databaseName) {
    if (typeof databaseName !== 'string') {
        throw new TypeError('database name must be a string');
    }
    if (databaseCache.has(databaseName)) {
        return databaseCache.get(databaseName);
    } else {
        const db = new Couch(databaseName);
        databaseCache.set(databaseName, db);
        return db;
    }
};

Couch.prototype.addAttachmentById = Couch.prototype.addAttachmentsById;
Couch.prototype.addAttachmentByUuid = Couch.prototype.addAttachmentsByUuid;

module.exports = Couch;

function updateEntry(ctx, oldDoc, newDoc, user, options) {
    debug.trace('update entry');
    var res;
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
    // Doc validation will fail $kind changed
    oldDoc.$kind = newDoc.$kind;
    return saveEntry(ctx._db, oldDoc, user)
        .then(r => res = r)
        .then(addGroups(ctx, user, options.groups))
        .then(() => res);
}

function onNotFound(ctx, entry, user, options) {
    return error => {
        var res;
        if (error.reason === 'not found') {
            debug.trace('doc not found');
            if (options.isUpdate) {
                throw new CouchError('Document does not exist', 'not found');
            }

            return createNew(ctx, entry, user)
                .then(r => res = r)
                .then(addGroups(ctx, user, options.groups))
                .then(() => res);
        } else {
            throw error;
        }
    };
}

function checkDesignDoc(db, custom) {
    debug.trace('check design doc');
    return nanoPromise.getDocument(db, constants.DESIGN_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug.trace('design doc missing');
                return createDesignDoc(db, null, custom);
            }
            if (
                doc.version !== constants.DESIGN_DOC_VERSION ||
                (custom && doc.customVersion !== custom.version)
            ) {
                debug.trace('design doc needs update');
                return createDesignDoc(db, doc._rev, custom);
            }
        });
}

function createDesignDoc(db, revID, custom) {
    debug.trace('create design doc');
    const designDoc = getDesignDoc(custom);
    if (revID) {
        designDoc._rev = revID;
    }
    return nanoPromise.insertDocument(db, designDoc);
}

function getOwnersById(db, id) {
    return nanoPromise.queryView(db, 'ownersById', {key: id});
}

function isOwner(owners, user) {
    for (var i = 0; i < owners.length; i++) {
        if (owners[i] === user) return true;
    }
    return false;
}

function validateRights(db, owners, user, rights) {
    debug.trace('validateRights');
    if (!Array.isArray(owners[0])) {
        owners = [owners];
    }

    let areOwners = owners.map(owner => isOwner(owner, user));

    if (areOwners.every(value => value === true)) {
        return Promise.resolve(areOwners);
    }

    if (typeof rights === 'string') {
        rights = [rights];
    }
    if (!Array.isArray(rights)) {
        throw new TypeError('rights must be an array or a string');
    }

    var checks = [];
    for (let i = 0; i < rights.length; i++) {
        checks.push(checkGlobalRight(db, user, rights[i])
            .then(function (hasGlobal) {
                if (hasGlobal) return owners.map(() => true);
                return Promise.all([getDefaultGroups(db, user), nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, rights[i]]}, {onlyValue: true})])
                    .then(result => {
                        const defaultGroups = result[0];
                        const groups = result[1];
                        return owners.map((owners, idx) => {
                            if (areOwners[idx]) return true;
                            for (let j = 0; j < owners.length; j++) {
                                if (groups.indexOf(owners[j]) > -1) return true;
                                for (let k = 0; k < defaultGroups.length; k++) {
                                    if (owners.indexOf(defaultGroups[k].name) !== -1 && defaultGroups[k].rights.indexOf(rights[i]) !== -1) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                    });
            }));
    }

    // Promise resolves with for each right an array of true/false for each passed owner
    // For example
    //         read                 write
    //   doc1  doc2  doc3    doc1   doc2  doc3
    // [[true, true, false],[false, true, false]]

    return Promise.all(checks).then(result => {
        if (result.length === 0) {
            return areOwners;
        }
        return result[0].map((value, idx) => {
            for (let i = 0; i < result.length; i++) {
                if (result[i][idx] === true) {
                    return true;
                }
            }
            return false;
        });
    });

    //return Promise.all(checks).then(result => result.some(value => value === true));
}

function getGroup(db, name) {
    debug.trace('get group');
    return nanoPromise.queryView(db, 'groupByName', {key: name, reduce: false, include_docs: true})
        .then(groups => {
            if (!groups || groups.length === 0) {
                debug.trace('group does not exist');
                return null;
            }
            if (groups.length > 1) {
                debug.warn('Getting more than one result for a group name');
            }
            debug.trace('group exists');
            return groups[0].doc;
        });
}

function createNew(ctx, entry, user) {
    debug.trace('create new');
    return checkGlobalRight(ctx._db, user, 'create').then(ok => {
        if (ok) {
            debug.trace('has right, create new');
            const newEntry = {
                $type: 'entry',
                $id: entry.$id,
                $kind: entry.$kind,
                $owners: [user],
                $content: entry.$content
            };
            return saveEntry(ctx._db, newEntry, user);
        } else {
            let msg = `${user} not allowed to create`;
            debug.trace(msg);
            throw new CouchError(msg, 'unauthorized');
        }
    });
}

function addGroups(ctx, user, groups) {
    return doc => {
        let prom = Promise.resolve();
        for (let i = 0; i < groups.length; i++) {
            prom = prom.then(() => ctx.addGroupToEntryByUuid(doc.id, user, groups[i]));
        }
        return prom;
    };
}


function checkRightsDoc(db, rights) {
    debug.trace('check rights doc');
    return nanoPromise.getDocument(db, constants.RIGHTS_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug.trace('rights doc does not exist');
                return createRightsDoc(db, rights);
            }
        });
}

function createRightsDoc(db, rightsDoc) {
    return nanoPromise.insertDocument(db, rightsDoc);
}

function checkDefaultGroupsDoc(db) {
    debug.trace('check defaultGroups doc');
    return nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug.trace('defaultGroups doc does not exist');
                return nanoPromise.insertDocument(db, {
                    _id: constants.DEFAULT_GROUPS_DOC_ID,
                    $type: 'db',
                    anonymous: [],
                    anyuser: []
                });
            }
        });
}

function checkGlobalRight(db, user, right) {
    debug.trace(`checkGlobalRight (${user}, ${right})`);
    return nanoPromise.queryView(db, 'globalRight', {key: right}, {onlyValue: true})
        .then(function (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i] === 'anonymous' || result[i] === user || result[i] === 'anyuser' && user !== 'anonymous') {
                    debug.trace(`user ${user} has global right`);
                    return true;
                }
            }
            debug.trace(`user ${user} does not have global right`);
            return false;
        });
}

function checkRightAnyGroup(db, user, right) {
    debug.trace(`checkRightAnyGroup (${user}, ${right}`);
    return checkGlobalRight(db, user, right)
        .then(hasGlobal => {
            if (hasGlobal) return true;
            return getDefaultGroups(db, user)
                .then(defaultGroups => {
                    for (let i = 0; i < defaultGroups.length; i++) {
                        if (defaultGroups[i].rights.indexOf(right) !== -1) {
                            return true;
                        }
                    }
                    return nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, right]})
                        .then(result => result.length > 0);
                });
        });
}

function getDefaultGroups(db, user) {
    debug.trace('getDefaultGroups');
    return nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID)
        .then(defaultGroups => {
            const toGet = new Set();
            for (let i = 0; i < defaultGroups.anonymous.length; i++) {
                toGet.add(defaultGroups.anonymous[i]);
            }
            if (user !== 'anonymous') {
                for (let i = 0; i < defaultGroups.anyuser.length; i++) {
                    toGet.add(defaultGroups.anyuser[i]);
                }
            }
            return Promise.all(Array.from(toGet).map(group => getGroup(db, group)));
        });
}

function getDefaultEntry() {
    return {};
}

function getUser(db, user) {
    return nanoPromise.queryView(db, 'user', {key: user, include_docs: true})
        .then(rows => {
            if (!rows.length) return null;
            if (rows.length > 1) throw new CouchError('Unexepected: more than 1 user profile', 'unreachable');
            return rows[0].doc;
        });
}

function saveEntry(db, entry, user) {
    if (entry.$id === undefined) {
        entry.$id = null;
    }
    if (entry.$kind === undefined) {
        entry.$kind = null;
    }
    const now = Date.now();
    entry.$lastModification = user;
    entry.$modificationDate = now;
    if (entry.$creationDate === undefined) {
        entry.$creationDate = now;
    }
    return nanoPromise.insertDocument(db, entry)
        .then(result => {
            result.$modificationDate = entry.$modificationDate;
            result.$creationDate = entry.$creationDate;
            return result;
        });
}

function getAttachmentFromEntry(ctx, name, asStream) {
    return function (entry) {
        if (entry._attachments && entry._attachments[name]) {
            return nanoPromise.getAttachment(ctx._db, entry._id, name, asStream);
        } else {
            throw new CouchError(`attachment ${name} not found`, 'not found');
        }
    };
}

function isValidGlobalRightUser(user) {
    return isSpecialUser(user) || isEmail(user);
}

function isSpecialUser(user) {
    return user === 'anonymous' || user === 'anyuser';
}

function isValidGroupName(group) {
    return !isEmail(group);
}

function checkGlobalTypeAndUser(type, user) {
    if (globalRightTypes.indexOf(type) === -1) {
        return new CouchError('Invalid global right type', 'bad argument');
    }
    if (!isValidGlobalRightUser(user)) {
        return new CouchError('Invalid global right user', 'bad argument');
    }
}
