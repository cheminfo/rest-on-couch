'use strict';

const debug = require('debug')('couch:rest');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const designDoc = require('./design/app');
const nanoPromise = require('./util/nanoPromise');
const isEmail = require('./util/isEmail');

class Couch {
    constructor(options) {
        options = options || {};

        const database = options.database || process.env.REST_COUCH_DATABASE;
        if (!database) {
            throw new Error('database option is mandatory');
        }

        this._databaseName = database;

        this._couchOptions = {
            url: options.url || process.env.REST_COUCH_URL || 'http://localhost:5984',
            database,
            user: options.user || process.env.REST_COUCH_USER,
            password: options.password || process.env.REST_COUCH_PASSWORD
        };

        this._defaultEntry = options.defaultEntry || getDefaultEntry;

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
            .then(() => checkDesignDoc(this._db))
            .then(() => checkRightsDoc(this._db))
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

    createEntry(id, user, kind, throwIfExists) {
        debug('createEntry', id, user, kind);
        return this._init()
            .then(() => checkRightAnyGroup(this._db, user, 'create'))
            .then(hasRight => {
                if (!hasRight) {
                    debug('user is missing create right');
                    throw new CouchError('user is missing create right');
                }
                return nanoPromise.queryView(this._db, 'entryById', {key: id})
                    .then(result => {
                        if (result.length === 0) {
                            let newEntry;
                            const defaultEntry = this._defaultEntry;
                            if (typeof defaultEntry === 'function') {
                                newEntry = defaultEntry();
                            } else if (typeof defaultEntry[kind] === 'function') {
                                newEntry = defaultEntry[kind]();
                            } else {
                                throw new CouchError('unexpected type for default entry');
                            }
                            return Promise.resolve(newEntry)
                                .then(entry => {
                                    entry.$id = id;
                                    entry.$type = 'entry';
                                    entry.$owners = [user];
                                    beforeSaveEntry(entry);
                                    return nanoPromise.insertDocument(this._db, entry);
                                })
                                .then(info => info.id);
                        }
                        debug('entry already exists');
                        if (throwIfExists) {
                            throw new CouchError('entry already exists');
                        }
                        return result[0].id;
                    });
            });
    }

    getEntryByIdAndRights(id, user, rights) {
        debug('getEntryByIdAndRights', id, user, rights);
        return this._init()
            .then(() => getOwnersById(this._db, id))
            .then(owners => {
                if (owners.length === 0) {
                    debug('document not found');
                    throw new CouchError('document not found');
                }
                debug('check rights');
                // TODO handle more than one result
                return validateRights(this._db, owners[0].value, user, rights)
                    .then(ok => {
                        if (ok) {
                            debug('user has access');
                            return nanoPromise.getDocument(this._db, owners[0].id);
                        }
                        debug('user has no access');
                        throw new CouchError('user has no access');
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
                    throw new CouchError('document not found');
                }
                if (doc.$type !== 'entry') {
                    debug('document is not an entry');
                    throw new CouchError('document is not an entry');
                }
                debug('check rights');
                return validateRights(this._db, doc.$owners, user, rights)
                    .then(ok => {
                        if (ok) {
                            debug('user has access');
                            return doc;
                        }
                        debug('user has no access');
                        throw new CouchError('user has no access');
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
                if(!hasRight) throw new CouchError('unauthorized to edit group (only owner can)');
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

    addGroupToEntry(id, user, group) {
        return this._doUpdateOnEntry(id, user, 'addGroupToEntry', {group: group});
    }

    removeGroupFromEntry(id, user, group) {
        debug('remove group from entry');
        return this._doUpdateOnEntry(id, user, 'removeGroupFromEntry', {group: group});
    }

    deleteGroup(groupName, user) {
        debug('remove group');
        return this._init()
            .then(() => getGroup(this._db, groupName))
            .then(doc => {
                if(!doc) {
                    debug('group does not exist');
                    throw new Error('Group does not exist');
                }
                if(!isOwner(doc.$owners, user)) {
                    debug('not allowed to delete group');
                    throw new Error(`user ${user} is not an owner of the group`);
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
                if (!hasRight) throw new Error(`user ${user} does not have createGroup right`);
            })
            .then(() => getGroup(this._db, groupName))
            .then(group => {
                if (group) throw new Error(`group ${groupName} already exists`);
                return nanoPromise.insertDocument(this._db, {
                    $type: 'group',
                    $owners: [user],
                    name: groupName,
                    users: [],
                    rights: rights
                });
            });
    }

    insertEntry(entry, user) {
        debug('insertEntry');
        if(!entry._id) return Promise.reject(new CouchError('Entry has no uuid'));

        return this.getEntryByUuidAndRights(entry._id, user, ['write'])
            .then(doc => {
                debug('got document');
                for(let key in entry) {
                    if(key[0] === '$') continue;
                    doc[key] = entry[key];
                }
                beforeSaveEntry(doc);
                return nanoPromise.insertDocument(this._db, doc);
            }).catch(error => {
                if(error.reason === 'not found') {
                    debug('doc not found, create new');
                    beforeSaveEntry(entry);
                    return nanoPromise.insertDocument(this._db, entry);
                } else {
                    debug('error getting document');
                    throw error;
                }
            });
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
}

Couch.prototype.addAttachment = Couch.prototype.addAttachments;

module.exports = Couch;

function checkDesignDoc(db) {
    debug('check design doc');
    return nanoPromise.getDocument(db, constants.DESIGN_DOC_ID)
        .then(doc => {
            if (doc === null) {
                debug('design doc missing');
                return createDesignDoc(db);
            }
            if (doc.version !== designDoc.version) {
                debug('design doc needs update');
                return createDesignDoc(db, doc._rev);
            }
        });
}

function createDesignDoc(db, revID) {
    debug('create design doc');
    if (revID) {
        designDoc._rev = revID;
    } else {
        delete designDoc._rev;
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
    if(isOwner(owners, user)) {
        return Promise.resolve(true);
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
                if (hasGlobal) return true;
                return nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, rights[i]]}, {onlyValue: true})
                    .then(function (groups) {
                        for (var i = 0; i < owners.length; i++) {
                            if (groups.indexOf(owners[i]) > -1) return true;
                        }
                        return false;
                    });
            }));
    }
    return Promise.all(checks).then(result => result.some(value => value === true));
}

function getGroup(db, name) {
    debug('get group');
    return nanoPromise.queryView(db, 'groupByName', {key: name, reduce: false, include_docs: true})
        .then(groups => {
            if(!groups || groups.length === 0) {
                debug('group does not exist');
                return null;
            }
            if(groups.length > 1) {
                debug('Getting more than one result for a group name')
            }
            debug('group exists');
            return groups[0].doc;
        });
}


function checkRightsDoc(db) {
    debug('check rights doc');
    return nanoPromise.getDocument(db, constants.RIGHTS_DOC_ID)
        .then(doc => {
            if(doc === null) {
                debug('rights doc does not exist');
                return createRightsDoc(db);
            }
        });
}

function createRightsDoc(db) {
    debug('create rights doc');
    const rightsDoc = {
        _id: constants.RIGHTS_DOC_ID,
        '$type': 'db',
        createGroup: ['anonymous'],
        create: ['anonymous'],
        read: ['anonymous']
    };
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

function beforeSaveEntry(entry) {
    const now = Date.now();
    entry.$modificationDate = now;
    if(entry.$creationDate === undefined) {
        entry.$creationDate = now;
    }
}
