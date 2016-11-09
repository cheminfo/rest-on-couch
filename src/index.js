'use strict';

const debug = require('./util/debug')('main');
const extend = require('extend');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const nanoPromise = require('./util/nanoPromise');
const getConfig = require('./config/config').getConfig;

const log = require('./couch/log');
const util = require('./couch/util');

const attachMethods = require('./couch/attachment');
const entryMethods = require('./couch/entry');
const initMethods = require('./couch/init');
const nanoMethods = require('./couch/nano');
const queryMethods = require('./couch/query');
const rightMethods = require('./couch/right');
const tokenMethods = require('./couch/token');
const userMethods = require('./couch/user');
const validateMethods = require('./couch/validate');

process.on('unhandledRejection', function (err) {
    debug.error('unhandled rejection: ' + err.stack);
});

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

const allowedFirstLevelKeys = new Set(['$deleted']);

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
        if (database.startsWith('_')) {
            throw new CouchError('database name cannot start with an underscore');
        }

        this._databaseName = database;

        const config = getConfig(database, options);

        this._couchOptions = {
            url: config.url,
            database,
            username: config.username,
            password: config.password,
            autoCreate: config.autoCreateDatabase
        };

        this._logLevel = log.getLevel(config.logLevel);

        this._customDesign = config.customDesign || {};
        this._viewsWithOwner = new Set();
        if (this._customDesign.views) {
            for (const i in this._customDesign.views) {
                if (this._customDesign.views[i].withOwner) {
                    this._viewsWithOwner.add(i);
                }
            }
        }

        this._defaultEntry = config.defaultEntry || getDefaultEntry;
        this._rights = Object.assign({}, basicRights, config.rights || defaultRights);

        this._nano = nano(this._couchOptions.url);
        this._db = null;
        this._lastAuth = 0;
        this._initPromise = null;
        this._currentAuth = null;
        this._authRenewal = null;
        this._authRenewalInterval = config.authRenewal;
        this.open().catch(() => {});
    }

    async open() {
        if (this._initPromise) {
            return this._initPromise;
        }
        return this._initPromise = this.getInitPromise();
    }

    close() {
        clearInterval(this._authRenewal);
    }

    async getEntriesByUserAndRights(user, rights, options = {}) {
        debug(`getEntriesByUserAndRights (${user}, ${rights})`);
        const limit = options.limit;
        const skip = options.skip;

        await this.open();

        // First we get a list of owners for each document
        const owners = await nanoPromise.queryView(this._db, 'ownersById', {
            reduce: false,
            include_docs: false
        });

        // Check rights for current user and keep only documents with granted access
        const hasRights = await validateMethods.validateRights(this._db, owners.map(r => r.value), user, rights || 'read');
        let allowedDocs = owners.filter((r, idx) => hasRights[idx]);

        // Apply pagination options
        if (skip) allowedDocs = allowedDocs.slice(skip);
        if (limit) allowedDocs = allowedDocs.slice(0, limit);

        // Get each document from CouchDB
        return Promise.all(allowedDocs.map(doc => nanoPromise.getDocument(this._db, doc.id)));
    }

    hasRightForEntry(uuid, user, right, options) {
        return this.getEntryByUuidAndRights(uuid, user, right, options)
            .then(() => {
                return true;
            }, err => {
                if (err.reason === 'unauthorized') return false;
                // Propagate
                throw err;
            });
    }

    getEntryByUuid(uuid, user, options) {
        return this.getEntryByUuidAndRights(uuid, user, 'read', options);
    }

    getEntryById(id, user, options) {
        return this.getEntryByIdAndRights(id, user, 'read', options);
    }

    async _doUpdateOnEntry(id, user, update, updateBody) {
        // Call update handler
        await this.open();
        const doc = await this.getEntryById(id, user);
        const hasRight = validateMethods.isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return nanoPromise.updateWithHandler(this._db, update, doc._id, updateBody);
    }

    async _doUpdateOnEntryByUuid(uuid, user, update, updateBody) {
        await this.open();
        const doc = await this.getEntryByUuid(uuid, user);
        const hasRight = validateMethods.isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return nanoPromise.updateWithHandler(this._db, update, uuid, updateBody);
    }

    async addFileToJpath(id, user, jpath, json, file, newContent) {
        if (!Array.isArray(jpath)) {
            throw new CouchError('jpath must be an array');
        }
        if (typeof json !== 'object') {
            throw new CouchError('json must be an object');
        }
        if (typeof file !== 'object') {
            throw new CouchError('file must be an object');
        }
        if (!file.field || !file.name || !file.data) {
            throw new CouchError('file must have field, name and data properties');
        }

        const entry = await this.getEntryByIdAndRights(id, user, ['write']);
        let current = entry.$content || {};

        if (newContent) {
            extend(current, newContent);
        }

        for (var i = 0; i < jpath.length; i++) {
            let newCurrent = current[jpath[i]];
            if (!newCurrent) {
                if (i < jpath.length - 1) {
                    newCurrent = current[jpath[i]] = {};
                } else {
                    newCurrent = current[jpath[i]] = [];
                }
            }
            current = newCurrent;
        }
        if (!Array.isArray(current)) {
            throw new CouchError('jpath must point to an array');
        }

        if (file.reference) {
            let found = current.find(el => el.reference === file.reference);
            if (found) {
                Object.assign(found, json);
                json = found;
            } else {
                json.reference = file.reference;
                current.push(json);
            }
        } else {
            current.push(json);
        }

        json[file.field] = {
            filename: file.name
        };

        if (!entry._attachments) entry._attachments = {};

        entry._attachments[file.name] = {
            content_type: file.content_type,
            data: file.data.toString('base64')
        };
        return this.insertEntry(entry, user);
    }

    async editDefaultGroup(group, type, action) {
        if (action !== 'add' && action !== 'remove') {
            throw new CouchError('edit default group invalid action', 'bad argument');
        }
        if (!util.isSpecialUser(type)) {
            throw new CouchError('edit default group invalid type', 'bad argument');
        }
        if (!util.isValidGroupName(group)) {
            throw new CouchError('edit default group invalid group name', 'bad argument');
        }

        const doc = await nanoPromise.getDocument(this._db, constants.DEFAULT_GROUPS_DOC_ID);
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
        return this._doUpdateOnEntry(id, user, 'removeGroupFromEntry', {group});
    }

    removeGroupFromEntryByUuid(uuid, user, group) {
        debug(`removeGroupFromEntryByUuid (${uuid}, ${user}, ${group})`);
        return this._doUpdateOnEntryByUuid(uuid, user, 'removeGroupFromEntry', {group});
    }

    async deleteGroup(groupName, user) {
        debug(`deleteGroup (${groupName}, ${user})`);
        await this.open();

        const doc = await nanoMethods.getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!validateMethods.isOwner(doc.$owners, user)) {
            debug.trace('not allowed to delete group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }

        // TODO Change entries which have this group
        return nanoPromise.destroyDocument(this._db, doc._id);
    }

    async createGroup(groupName, user, rights) {
        debug(`createGroup (${groupName}, ${user})`);
        if (!Array.isArray(rights)) rights = ['read'];

        await this.open();

        const hasRight = await validateMethods.checkRightAnyGroup(this._db, user, 'createGroup');
        if (!hasRight) throw new CouchError(`user ${user} does not have createGroup right`);

        const group = await nanoMethods.getGroup(this._db, groupName);
        if (group) throw new CouchError(`group ${groupName} already exists`, 'exists');

        return nanoPromise.insertDocument(this._db, {
            $type: 'group',
            $owners: [user],
            name: groupName,
            users: [],
            rights: rights
        });
    }

    async getGroup(groupName, user) {
        debug(`getGroup (${groupName}, ${user})`);
        await this.open();
        const doc = await nanoMethods.getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!validateMethods.isOwner(doc.$owners, user)) {
            debug.trace('not allowed to get group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }
        return doc;
    }

    /**
     * Returns a list of groups that grant a given right to the user
     * @param {string} user
     * @param {string} right
     * @return {Array}
     */
    async getGroupsByRight(user, right) {
        debug.trace(`getGroupsByRight (${user}, ${right})`);
        await this.open();
        // Search in default groups
        const defaultGroups = await validateMethods.getDefaultGroups(this._db, user, true);
        // Search inside groups
        const userGroups = await nanoPromise.queryView(this._db, 'groupByUserAndRight', {key: [user, right]}, {onlyValue: true});
        // Merge both lists
        const union = new Set([...defaultGroups, ...userGroups]);
        return Array.from(union);
    }

    async insertEntry(entry, user, options) {
        debug(`insertEntry (id: ${entry._id}, user: ${user}, options: ${options})`);
        await this.open();

        options = options || {};
        options.groups = options.groups || [];
        if (!entry.$content) throw new CouchError('entry has no content');
        if (options.groups !== undefined && !Array.isArray(options.groups)) throw new CouchError('options.groups should be an array if defined', 'invalid argument');

        if (entry._id && options.isNew) {
            debug.trace('new entry has _id');
            throw new CouchError('entry should not have _id', 'bad argument');
        }

        const notFound = onNotFound(this, entry, user, options);

        let result;
        let action = 'updated';
        if (entry._id) {
            try {
                const doc = await this.getEntryByUuidAndRights(entry._id, user, ['write']);
                result = await updateEntry(this, doc, entry, user, options);
            } catch (e) {
                result = await notFound(e);
                action = 'created';
            }
        } else if (entry.$id) {
            debug.trace('entry has no _id but has $id');
            try {
                const doc = await this.getEntryByIdAndRights(entry.$id, user, ['write']);
                result = await updateEntry(this, doc, entry, user, options);
            } catch (e) {
                result = await notFound(e);
                action = 'created';
            }
        } else {
            debug.trace('entry has no _id nor $id');
            if (options.isUpdate) {
                throw new CouchError('entry should have an _id', 'bad argument');
            }
            const res = await createNew(this, entry, user);
            action = 'created';
            await addGroups(this, user, options.groups)(res);
            result = res;
        }

        return {info: result, action};
    }

    log(message, level) {
        debug(`log (${message}, ${level})`);
        return this.open().then(() => log.log(this._db, this._logLevel, message, level));
    }

    getLogs(epoch) {
        debug(`getLogs (${epoch}`);
        return this.open().then(() => log.getLogs(this._db, epoch));
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

function extendCouch(methods) {
    for (const method in methods) {
        Couch.prototype[method] = methods[method];
    }
}

extendCouch(attachMethods.methods);
extendCouch(entryMethods.methods);
extendCouch(initMethods.methods);
extendCouch(queryMethods.methods);
extendCouch(rightMethods.methods);
extendCouch(tokenMethods.methods);
extendCouch(userMethods.methods);

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
    if (newDoc._attachments) {
        oldDoc._attachments = newDoc._attachments;
    }
    for (let key in newDoc) {
        if (allowedFirstLevelKeys.has(key)) {
            oldDoc[key] = newDoc[key];
        }
    }
    // Doc validation will fail $kind changed
    oldDoc.$kind = newDoc.$kind;
    return nanoMethods.saveEntry(ctx._db, oldDoc, user)
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

async function createNew(ctx, entry, user) {
    debug.trace('create new');
    const ok = await validateMethods.checkGlobalRight(ctx._db, user, 'create');
    if (ok) {
        debug.trace('has right, create new');
        const newEntry = {
            $type: 'entry',
            $id: entry.$id,
            $kind: entry.$kind,
            $owners: [user],
            $content: entry.$content,
            _attachments: entry._attachments
        };
        return nanoMethods.saveEntry(ctx._db, newEntry, user);
    } else {
        let msg = `${user} not allowed to create`;
        debug.trace(msg);
        throw new CouchError(msg, 'unauthorized');
    }
}

function addGroups(ctx, user, groups) {
    return async doc => {
        for (let i = 0; i < groups.length; i++) {
            await ctx.addGroupToEntryByUuid(doc.id, user, groups[i]);
        }
    };
}

function getDefaultEntry() {
    return {};
}
