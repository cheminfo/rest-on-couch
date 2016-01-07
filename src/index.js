'use strict';

const debug = require('debug')('couch:rest');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getDesignDoc = require('./design/app');
const nanoPromise = require('./util/nanoPromise');
const log = require('./couch/log');
const dbconfig = require('./util/dbconfig');

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
        if(typeof options === 'string') {
            options = dbconfig.database(options);
        }
        options = options || {};

        const database = options.database || constants.REST_COUCH_DATABASE;
        if (!database) {
            throw new CouchError('database option is mandatory');
        }

        this._databaseName = database;

        this._couchOptions = {
            url: options.url || constants.REST_COUCH_URL,
            database,
            user: options.user || constants.REST_COUCH_USER,
            password: options.password || constants.REST_COUCH_PASSWORD
        };

        this._logLevel = log.getLevel(options.logLevel || process.env.REST_LOG_LEVEL || 'WARN');

        this._customDesign = options.customDesign || {};
        this._defaultEntry = options.defaultEntry || getDefaultEntry;
        this._rights = Object.assign({}, basicRights, options.rights || defaultRights);

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
        debug('initialize');
        return this._initPromise = this._authenticate()
            .then(() => nanoPromise.getDatabase(this._nano, this._couchOptions.database))
            .then(db => {
                if (!db) {
                    debug('db not found -> create');
                    return nanoPromise.createDatabase(this._nano, this._couchOptions.database);
                }
            })
            .then(() => checkDesignDoc(this._db, this._customDesign))
            .then(() => checkRightsDoc(this._db, this._rights))
    }

    _authenticate() {
        if (this._currentAuth) {
            return this._currentAuth;
        }
        let prom = Promise.resolve();
        if (this._couchOptions.user) {
            debug('authenticate to CouchDB');
            prom = nanoPromise.authenticate(
                this._nano,
                this._couchOptions.user,
                this._couchOptions.password
            ).then(cookie => {
                this._nano = nano({
                    url: this._couchOptions.url,
                    cookie
                });
            });
        } else {
            debug('no user provided, continue assuming admin party');
        }
        return this._currentAuth = prom.then(() => {
            this._db = this._nano.db.use(this._couchOptions.database);
        });
    }

    createEntry(id, user, options) {
        options = options || {};
        debug('createEntry', id, user, options.kind);
        return this._init()
            .then(() => checkRightAnyGroup(this._db, user, 'create'))
            .then(hasRight => {
                if (!hasRight) {
                    debug('user is missing create right');
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
                                        $content: entry
                                    };
                                    beforeSaveEntry(toInsert, user);
                                    return nanoPromise.insertDocument(this._db, toInsert);
                                })
                                .then(info => info.id);
                        }
                        debug('entry already exists');
                        if (options.throwIfExists) {
                            throw new CouchError('entry already exists', 'exists');
                        }
                        return result[0].id;
                    });
            });
    }

    queryViewByUser(user, view, options, rights) {
        debug(`queryViewByUser (user: ${user}, view: ${view}`);
        options = options || {};
        options.include_docs = true;
        options.reduce = false;
        return this._init()
            .then(() => nanoPromise.queryView(this._db, view, options))
            .then(rows => {
                let owners = rows.map(r => r.doc.$owners);
                return validateRights(this._db, owners, user, rights || 'read')
                    .then(hasRights => {
                        rows = rows.map(entry => entry.doc);
                        return rows.filter((r, idx) => hasRights[idx]);
                    });

            });
    }

    getEntriesByUserAndRights(user, rights) {
        return this.queryViewByUser(user, 'entryById', {}, rights);
    }

    getEntryByIdAndRights(id, user, rights) {
        debug(`getEntryByIdAndRights (id: ${id}, user: ${user}, rights: ${rights}`);
        return this._init()
            .then(() => getOwnersById(this._db, id))
            .then(owners => {
                if (owners.length === 0) {
                    debug('document not found');
                    throw new CouchError('document not found', 'not found');
                }
                debug('check rights');
                // TODO handle more than one result
                return validateRights(this._db, owners[0].value, user, rights)
                    .then(ok => {
                        if (ok[0]) {
                            debug('user has access');
                            return nanoPromise.getDocument(this._db, owners[0].id);
                        }
                        debug('user has no access');
                        throw new CouchError('user has no access', 'unauthorized');
                    });
            });
    }

    getEntryByUuidAndRights(uuid, user, rights) {
        debug('getEntryByUuidAndRights', uuid, user, rights);
        return this._init()
            .then(() => nanoPromise.getDocument(this._db, uuid))
            .then(doc => {
                if (!doc) {
                    debug('document not found');
                    throw new CouchError('document not found', 'not found');
                }
                if (doc.$type !== 'entry') {
                    debug('document is not an entry');
                    throw new CouchError('document is not an entry', 'not entry');
                }
                debug('check rights');
                return validateRights(this._db, doc.$owners, user, rights)
                    .then(ok => {
                        if (ok[0]) {
                            debug('user has access');
                            return doc;
                        }
                        debug('user has no access');
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

    addAttachments(id, user, attachments) {
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        return this.getEntryByIdAndRights(id, user, ['write', 'addAttachment'])
            .then(entry => nanoPromise.attachFiles(this._db, entry, attachments));
    }

    getAttachmentByIdAndName(id, name, user, asStream) {
        return this.getEntryById(id, user)
            .then(getAttachmentFromEntry(this._db, name, asStream));
    }

    getAttachmentByUuidAndName(uuid, name, user, asStream) {
        return this.getEntryByUuid(uuid, user)
            .then(getAttachmentFromEntry(this._db, name, asStream));
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
                current.push(json);
                if (!json.file) {
                    json.file = [];
                }
                json.file.push({
                    type: file.type,
                    filename: file.name
                });
                return nanoPromise.attachFiles(this._db, entry, [file])
                    .then(body => {
                        entry._rev = body.rev;
                        return this.insertEntry(entry, user)
                    });
            });
    }

    addGroupToEntry(id, user, group) {
        debug(`addGroupToEntry id:${id}, user: ${user}, group: ${group}`);
        return this._doUpdateOnEntry(id, user, 'addGroupToEntry', {group: group});
    }

    removeGroupFromEntry(id, user, group) {
        debug(`remove group from entry id:${id}, user: ${user}, group: ${group}`);
        return this._doUpdateOnEntry(id, user, 'removeGroupFromEntry', {group: group});
    }

    deleteGroup(groupName, user) {
        debug('remove group');
        return this._init()
            .then(() => getGroup(this._db, groupName))
            .then(doc => {
                if (!doc) {
                    debug('group does not exist');
                    throw new CouchError('group does not exist', 'not found');
                }
                if (!isOwner(doc.$owners, user)) {
                    debug('not allowed to delete group');
                    throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
                }

                // TODO Change entries which have this group
                return nanoPromise.destroyDocument(this._db, doc._id);
            });
    }

    createGroup(groupName, user, rights) {
        debug('createGroup', groupName, user);
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

    insertEntry(entry, user, groups) {
        debug('insertEntry');
        let that = this;
        groups = groups || [];
        if (!entry.$content) return Promise.reject(new CouchError('entry has no content'));
        if (groups !== undefined && !Array.isArray(groups)) return Promise.reject(new CouchError('groups should an arary if defined', 'invalid argument'));

        let prom;
        if (entry._id) {
            prom = this.getEntryByUuidAndRights(entry._id, user, ['write'])
                .then(doc => {
                    debug('got document');
                    if (doc._rev !== entry._rev) {
                        debug('document and entry _rev differ');
                        throw new CouchError('document and entry _rev differ', 'conflict');
                    }
                    doc.$content = entry.$content;
                    beforeSaveEntry(doc, user);
                    return nanoPromise.insertDocument(this._db, doc).then(addGroups(this, doc.$id, user, groups));
                }).catch(error => {
                    if (error.reason === 'not found') {
                        debug('doc not found');
                        return createNew(this, entry, user).then(addGroups(this, entry.$id, user, groups));
                    } else {
                        debug('error getting document');
                        throw error;
                    }
                });
        } else {
            debug('entry has no _id');
            prom = createNew(this, entry, user).then(addGroups(this, entry.$id, user, groups));
        }

        return prom;
    }

    deleteEntryByUuid(uuid, user) {
        debug('deleteEntryByUuid');
        return this.getEntryByUuidAndRights(uuid, user, 'delete')
            .then(() => nanoPromise.destroyDocument(this._db, uuid));
    }

    deleteEntryById(id, user) {
        debug('deleteEntry');
        return this.getEntryByIdAndRights(id, user, 'delete')
            .then(doc => nanoPromise.destroyDocument(this._db, doc._id));
    }

    log(message, level) {
        debug('log', message, level);
        return this._init().then(() => log.log(this._db, this._logLevel, message, level));
    }

    getLogs(epoch) {
        return this._init().then(() => log.getLogs(this._db, epoch));
    }
}

Couch.prototype.addAttachment = Couch.prototype.addAttachments;

module.exports = Couch;

function checkDesignDoc(db, custom) {
    debug('check design doc');
    return nanoPromise.getDocument(db, constants.DESIGN_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug('design doc missing');
                return createDesignDoc(db, null, custom);
            }
            if (
                doc.version !== constants.DESIGN_DOC_VERSION ||
                (custom && doc.customVersion !== custom.version)
            ) {
                debug('design doc needs update');
                return createDesignDoc(db, doc._rev, custom);
            }
        });
}

function createDesignDoc(db, revID, custom) {
    debug('create design doc');
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
    // owner has all the rights
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
                return nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, rights[i]]}, {onlyValue: true})
                    .then(function (groups) {
                        return owners.map((owners, idx) => {
                            if (areOwners[idx]) return true;
                            for (var i = 0; i < owners.length; i++) {
                                if (groups.indexOf(owners[i]) > -1) return true;
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
    debug('get group');
    return nanoPromise.queryView(db, 'groupByName', {key: name, reduce: false, include_docs: true})
        .then(groups => {
            if (!groups || groups.length === 0) {
                debug('group does not exist');
                return null;
            }
            if (groups.length > 1) {
                debug('Getting more than one result for a group name')
            }
            debug('group exists');
            return groups[0].doc;
        });
}

function createNew(ctx, entry, user) {
    debug('check create right');
    return checkGlobalRight(ctx._db, user, 'create').then(ok => {
        if (ok) {
            debug('has right, create new');
            const newEntry = {
                $type: 'entry',
                $id: entry.$id,
                $owners: [user],
                $content: entry.$content
            };
            beforeSaveEntry(newEntry, user);
            return nanoPromise.insertDocument(ctx._db, newEntry);
        } else {
            let msg = `${user} not allowed to create`;
            debug(msg);
            throw new CouchError(msg, 'unauthorized');
        }
    });
}

function addGroups(ctx, entryId, user, groups) {
    return () => {
        let prom = Promise.resolve();
        for (let i = 0; i < groups.length; i++) {
            prom = prom.then(() => ctx.addGroupToEntry(entryId, user, groups[i]));
        }
        return prom;
    }
}


function checkRightsDoc(db, rights) {
    debug('check rights doc');
    return nanoPromise.getDocument(db, constants.RIGHTS_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug('rights doc does not exist');
                return createRightsDoc(db, rights);
            }
        });
}

function createRightsDoc(db, rightsDoc) {
    debug('create rights doc');
    return nanoPromise.insertDocument(db, rightsDoc);
}

function checkGlobalRight(db, user, right) {
    debug('checkGlobalRight ', user, right);
    return nanoPromise.queryView(db, 'globalRight', {key: right}, {onlyValue: true})
        .then(function (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i] === 'anonymous' || result[i] === user) {
                    debug('user has global right');
                    return true;
                }
            }
            debug('user does not have global right');
            return false;
        });
}

function checkRightAnyGroup(db, user, right) {
    debug('checkRightAnyGroup', user, right);
    return checkGlobalRight(db, user, right)
        .then(hasGlobal => {
            if (hasGlobal) return true;
            return nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, right]})
                .then(result => result.length > 0);
        });
}

function getDefaultEntry() {
    return {};
}

function beforeSaveEntry(entry, user) {
    const now = Date.now();
    entry.$lastModification = user;
    entry.$modificationDate = now;
    if (entry.$creationDate === undefined) {
        entry.$creationDate = now;
    }
}

function getAttachmentFromEntry(db, name, asStream) {
    return function (entry) {
        if (entry._attachments && entry._attachments[name]) {
            return nanoPromise.getAttachment(db, entry._id, name, asStream);
        } else {
            throw new CouchError(`attachment ${name} not found`);
        }
    };
}
