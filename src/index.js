'use strict';

const debug = require('./util/debug')('main');
const _ = require('lodash');
const extend = require('extend');
const nano = require('nano');
const objHash = require('object-hash');
const includes = require('array-includes');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getDesignDoc = require('./design/app');
const nanoPromise = require('./util/nanoPromise');
const getConfig = require('./config/config').getConfig;
const globalRightTypes = ['read', 'write', 'create', 'createGroup'];

const log = require('./couch/log');
const util = require('./couch/util');
const getGroup = require('./couch/nano').getGroup;
const validate = require('./couch/validate');
const entryMethods = require('./couch/entry');
const tokenMethods = require('./couch/token');
const userMethods = require('./couch/user');

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
    }

    _renewAuthentication() {
        if (this._authRenewal) {
            clearInterval(this._authRenewal);
        }
        this._authRenewal = setInterval(() => {
            this._currentAuth = this.getAuthenticationPromise();
        }, this._authRenewalInterval * 1000);
    }

    _authenticate() {
        if (this._currentAuth) {
            return this._currentAuth;
        }
        return this._currentAuth = this.getAuthenticationPromise();
    }

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

    async createEntry(id, user, options) {
        options = options || {};
        debug(`createEntry (id: ${id}, user: ${user}, kind: ${options.kind})`);
        await this.open();
        const result = await nanoPromise.queryView(this._db, 'entryByOwnerAndId', {
            key: [user, id],
            reduce: false,
            include_docs: true
        });
        if (result.length === 0) {
            const hasRight = await validate.checkRightAnyGroup(this._db, user, 'create');
            if (!hasRight) {
                throw new CouchError('user is missing create right', 'unauthorized');
            }
            let newEntry;
            const defaultEntry = this._defaultEntry;
            if (typeof defaultEntry === 'function') {
                newEntry = defaultEntry.apply(null, options.createParameters || []);
            } else if (typeof defaultEntry[options.kind] === 'function') {
                newEntry = defaultEntry[options.kind].apply(null, options.createParameters || []);
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
                $kind: options.kind
            };
            return saveEntry(this._db, toInsert, user);
        }
        debug.trace('entry already exists');
        if (options.throwIfExists) {
            throw new CouchError('entry already exists', 'conflict');
        }
        // Return something similar to insertDocument
        return {
            ok: true,
            id: result[0].doc._id,
            rev: result[0].doc._rev,
            $modificationDate: result[0].doc.$modificationDate,
            $creationDate: result[0].doc.$creationDate
        };
    }

    async queryEntriesByRight(user, view, right, options) {
        debug(`queryEntriesByRights (${user}, ${view}, ${right})`);
        await this.open();
        options = options || {};
        if (!this._viewsWithOwner.has(view)) {
            throw new CouchError(`${view} is not a view with owner`, 'unauthorized');
        }
        right = right || 'read';

        // First check if user has global right
        const hasGlobalRight = await validate.checkGlobalRight(this._db, user, right);
        if (hasGlobalRight) {
            // When there is a global right, we cannot use queries because the first element of the
            // key will match all documents
            const result = await nanoPromise.queryView(this._db, view, {reduce: false});
            return _.uniqBy(result, 'id');
        }

        var userGroups = await this.getGroupsByRight(user, right);
        userGroups.push(user);
        if (options.groups) {
            var groupsToUse = [];
            if (!Array.isArray(options.groups)) options.groups = [options.groups];
            for (var i = 0; i < userGroups.length; i++) {
                if (options.groups.indexOf(userGroups[i]) >= 0) {
                    groupsToUse.push(userGroups[i]);
                }
            }
            userGroups = groupsToUse;
            if (userGroups.indexOf(user) === -1 && options.mine) {
                userGroups.push(user);
            }
        } else if (options.mine) {
            userGroups = [user];
        }


        const data = new Map();
        const userStartKey = options.key ? [options.key] : (options.startkey ? options.startkey : []);
        const userEndKey = options.key ? [options.key] : (options.endkey ? options.endkey : []);
        for (const group of userGroups) {
            const startkey = [group].concat(userStartKey);
            const endkey = [group].concat(userEndKey);
            endkey.push({});
            const result = await nanoPromise.queryView(this._db, view, {
                include_docs: options.include_docs,
                startkey,
                endkey,
                reduce: false
            });
            for (const el of result) {
                if (!data.has(el.id)) {
                    data.set(el.id, el);
                }
            }
        }
        return Array.from(data.values());
    }

    /*
     Like queryViewByUser but only entries are returned
     Since custom design views might emit for non-entries we
     need to ensure those are not returned to non-admin users
     */
    async queryEntriesByUser(user, view, options, rights) {
        const docs = await this.queryViewByUser(user, view, options, rights);
        return docs.filter(doc => doc.$type === 'entry');
    }

    async queryViewByUser(user, view, options, rights) {
        debug(`queryViewByUser (${user}, ${view})`);
        options = Object.assign({}, options);
        options.include_docs = true;
        options.reduce = false;
        options.skip = 0;
        var limit = options.limit || 1;
        var cumRows = [];
        await this.open();
        while (cumRows.length < limit) {
            let rows = await nanoPromise.queryView(this._db, view, options);
            // No more results
            if (!rows.length) break;

            let owners = rows.map(r => r.doc.$owners);
            let hasRights = await validate.validateRights(this._db, owners, user, rights || 'read');
            rows = rows.map(entry => entry.doc);
            rows = rows.filter((r, idx) => hasRights[idx]);

            // Return everything
            if (!options.limit) return rows;

            // Concatenate
            options.skip += options.limit;
            options.limit = options.limit * 2;
            cumRows = cumRows.concat(rows);
        }

        // Get rid of extra rows
        return cumRows.filter((r, idx) => idx < limit);
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
        const hasRights = await validate.validateRights(this._db, owners.map(r => r.value), user, rights || 'read');
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
        const hasRight = validate.isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return nanoPromise.updateWithHandler(this._db, update, doc._id, updateBody);
    }

    async _doUpdateOnEntryByUuid(uuid, user, update, updateBody) {
        await this.open();
        const doc = await this.getEntryByUuid(uuid, user);
        const hasRight = validate.isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return nanoPromise.updateWithHandler(this._db, update, uuid, updateBody);
    }

    async addAttachmentsById(id, user, attachments) {
        debug(`addAttachmentsById (${id}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByIdAndRights(id, user, ['write', 'addAttachment']);
        return nanoPromise.attachFiles(this._db, entry, attachments);
    }

    async addAttachmentsByUuid(uuid, user, attachments) {
        debug(`addAttachmentsByUuid (${uuid}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['write', 'addAttachment']);
        return nanoPromise.attachFiles(this._db, entry, attachments);
    }

    async deleteAttachmentByUuid(uuid, user, attachmentName) {
        debug(`deleteAttachmentByUuid (${uuid}, ${user})`);
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['delete', 'addAttachment']);
        if (!entry._attachments[attachmentName]) {
            return false;
        }
        delete entry._attachments[attachmentName];
        return saveEntry(this._db, entry, user);
    }

    getAttachmentByIdAndName(id, name, user, asStream, options) {
        debug(`getAttachmentByIdAndName (${id}, ${name}, ${user})`);
        return this.getEntryById(id, user, options)
            .then(getAttachmentFromEntry(this, name, asStream));
    }

    getAttachmentByUuidAndName(uuid, name, user, asStream, options) {
        debug(`getAttachmentByUuidAndName (${uuid}, ${name}, ${user})`);
        return this.getEntryByUuid(uuid, user, options)
            .then(getAttachmentFromEntry(this, name, asStream));
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

    async editGlobalRight(type, user, action) {
        if (action !== 'add' && action !== 'remove') {
            throw new CouchError('Edit global right invalid action', 'bad argument');
        }
        let e = checkGlobalTypeAndUser(type, user);
        if (e) {
            throw e;
        }

        const doc = await nanoPromise.getDocument(this._db, constants.RIGHTS_DOC_ID);
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
    }

    addGlobalRight(type, user) {
        return this.editGlobalRight(type, user, 'add');
    }

    removeGlobalRight(type, user) {
        return this.editGlobalRight(type, user, 'remove');
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

        const doc = await getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!validate.isOwner(doc.$owners, user)) {
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

        const hasRight = await validate.checkRightAnyGroup(this._db, user, 'createGroup');
        if (!hasRight) throw new CouchError(`user ${user} does not have createGroup right`);

        const group = await getGroup(this._db, groupName);
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
        const doc = await getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!validate.isOwner(doc.$owners, user)) {
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
        const defaultGroups = await validate.getDefaultGroups(this._db, user, true);
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

Couch.prototype.addAttachmentById = Couch.prototype.addAttachmentsById;
Couch.prototype.addAttachmentByUuid = Couch.prototype.addAttachmentsByUuid;

function extendCouch(methods) {
    for (const method in methods) {
        Couch.prototype[method] = methods[method];
    }
}

extendCouch(entryMethods.methods);
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

async function createNew(ctx, entry, user) {
    debug.trace('create new');
    const ok = await validate.checkGlobalRight(ctx._db, user, 'create');
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
        return saveEntry(ctx._db, newEntry, user);
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

function getDefaultEntry() {
    return {};
}

async function saveEntry(db, entry, user) {
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

    const result = await nanoPromise.insertDocument(db, entry);
    result.$modificationDate = entry.$modificationDate;
    result.$creationDate = entry.$creationDate;
    return result;
}

function getAttachmentFromEntry(ctx, name, asStream) {
    return async function (entry) {
        if (entry._attachments && entry._attachments[name]) {
            return nanoPromise.getAttachment(ctx._db, entry._id, name, asStream, {rev: entry._rev});
        } else {
            throw new CouchError(`attachment ${name} not found`, 'not found');
        }
    };
}

function checkGlobalTypeAndUser(type, user) {
    if (globalRightTypes.indexOf(type) === -1) {
        return new CouchError('Invalid global right type', 'bad argument');
    }
    if (!util.isValidGlobalRightUser(user)) {
        return new CouchError('Invalid global right user', 'bad argument');
    }
    return null;
}
