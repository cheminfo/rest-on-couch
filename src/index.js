'use strict';

const debug = require('./util/debug')('main');
const _ = require('lodash');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getDesignDoc = require('./design/app');
const nanoPromise = require('./util/nanoPromise');
const log = require('./couch/log');
const getConfig = require('./config/config').getConfig;
const globalRightTypes = ['read', 'write', 'create', 'createGroup'];
const isEmail = require('./util/isEmail');

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
        this.open();
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
                throw new CouchError('database does not exist', 'not found');
            }
        }
        // Must be done before the other checks because they can add documents to the db
        await checkSecurity(this._db, this._couchOptions.username);

        await Promise.all([
            checkDesignDoc(this._db, this._customDesign),
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

    async editUser(user, data) {
        if (!(data instanceof Object)) {
            throw new CouchError('user data should be an object', 'bad argument');
        }
        await this.open();
        try {
            const userDoc = await this.getUser(user);
            data = simpleMerge(data, userDoc);
        } catch (e) {
            if (e.reason !== 'not found') {
                throw e;
            }
        }

        data.$type = 'user';
        data.user = user;
        return await nanoPromise.insertDocument(this._db, data);
    }

    async getUser(user) {
        await this.open();
        return await getUser(this._db, user);
    }

    async createEntry(id, user, options) {
        options = options || {};
        debug(`createEntry (id: ${id}, user: ${user}, kind: ${options.kind})`);
        await this.open();
        const result = await nanoPromise.queryView(this._db, 'entryByOwnerAndId', {key: [user, id], reduce: false, include_docs: true});
        if (result.length === 0) {
            const hasRight = await checkRightAnyGroup(this._db, user, 'create');
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
            return await saveEntry(this._db, toInsert, user);
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
        const hasGlobalRight = await checkGlobalRight(this._db, user, right);
        if (hasGlobalRight) {
            // When there is a global right, we cannot use queries because the first element of the
            // key will match all documents
            const result = await nanoPromise.queryView(this._db, view, {reduce: false});
            return _.uniqBy(result, 'id');
        }

        const userGroups = await this.getGroupsByRight(user, right);
        userGroups.push(user);
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
        options = options || {};
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
            let hasRights = await validateRights(this._db, owners, user, rights || 'read');
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
    }

    async getEntriesByUserAndRights(user, rights, options) {
        debug(`getEntriesByUserAndRights (${user}, ${rights})`);
        options = options || {};
        const limit = options.limit;
        const skip = options.skip;

        await this.open();

        // First we get a list of owners for each document
        const owners = await nanoPromise.queryView(this._db, 'ownersById', {
            reduce: false,
            include_docs: false
        });

        // Check rights for current user and keep only documents with granted access
        const hasRights = await validateRights(this._db, owners.map(r => r.value), user, rights || 'read');
        let allowedDocs = owners.filter((r, idx) => hasRights[idx]);

        // Apply pagination options
        if (skip) allowedDocs = allowedDocs.slice(skip);
        if (limit) allowedDocs = allowedDocs.slice(0, limit);

        // Get each document from CouchDB
        return await Promise.all(allowedDocs.map(doc => nanoPromise.getDocument(this._db, doc.id)));
    }

    async getEntryByIdAndRights(id, user, rights, options) {
        debug(`getEntryByIdAndRights (${id}, ${user}, ${rights})`);
        await this.open();

        const owners = await getOwnersById(this._db, id);
        if (owners.length === 0) {
            debug.trace(`no entry matching id ${id}`);
            throw new CouchError('document not found', 'not found');
        }
        let hisEntry = owners.find(own => own.value[0] === user);
        if (!hisEntry) {
            hisEntry = owners[0];
        }

        const ok = await validateRights(this._db, hisEntry.value, user, rights);
        if (ok[0]) {
            debug.trace(`user ${user} has access`);
            return await nanoPromise.getDocument(this._db, hisEntry.id, options);
        }

        debug.trace(`user ${user} has no ${rights} access`);
        throw new CouchError('user has no access', 'unauthorized');
    }

    async getEntryByUuidAndRights(uuid, user, rights, options) {
        debug(`getEntryByUuidAndRights (${uuid}, ${user}, ${rights})`);
        await this.open();

        const doc = await nanoPromise.getDocument(this._db, uuid);
        if (!doc) {
            debug.trace('document not found');
            throw new CouchError('document not found', 'not found');
        }
        if (doc.$type !== 'entry') {
            debug.trace('document is not an entry');
            throw new CouchError('document is not an entry', 'not entry');
        }

        debug.trace('check rights');
        const ok = await validateRights(this._db, doc.$owners, user, rights);
        if (ok[0]) {
            debug.trace(`user ${user} has access`);
            if (!options) {
                return doc;
            } else {
                return await nanoPromise.getDocument(this._db, uuid, options);
            }
        }

        debug.trace(`user ${user} has no ${rights} access`);
        throw new CouchError('user has no access', 'unauthorized');
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
        const hasRight = isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return await nanoPromise.updateWithHandler(this._db, update, doc._id, updateBody);
    }

    async _doUpdateOnEntryByUuid(uuid, user, update, updateBody) {
        await this.open();
        const doc = await this.getEntryByUuid(uuid, user);
        const hasRight = isOwner(doc.$owners, user);
        if (!hasRight) {
            throw new CouchError('unauthorized to edit group (only owner can)', 'unauthorized');
        }
        return await nanoPromise.updateWithHandler(this._db, update, uuid, updateBody);
    }

    async addAttachmentsById(id, user, attachments) {
        debug(`addAttachmentsById (${id}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByIdAndRights(id, user, ['write', 'addAttachment']);
        return await nanoPromise.attachFiles(this._db, entry, attachments);
    }

    async addAttachmentsByUuid(uuid, user, attachments) {
        debug(`addAttachmentsByUuid (${uuid}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['write', 'addAttachment']);
        return await nanoPromise.attachFiles(this._db, entry, attachments);
    }

    async deleteAttachmentByUuid(uuid, user, attachmentName) {
        debug(`deleteAttachmentByUuid (${uuid}, ${user})`);
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['delete', 'addAttachment']);
        if (!entry._attachments[attachmentName]) {
            return;
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

    async addFileToJpath(id, user, jpath, json, file) {
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
        return await this.insertEntry(entry, user);
    }

    async editGlobalRight(type, user, action) {
        if (action !== 'add' && action !== 'remove') {
            throw new CouchError('Edit global right invalid action', 'bad argument');
        }
        let e;
        if (e = checkGlobalTypeAndUser(type, user)) {
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

        return await nanoPromise.insertDocument(this._db, doc);
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
        if (!isSpecialUser(type)) {
            throw new CouchError('edit default group invalid type', 'bad argument');
        }
        if (!isValidGroupName(group)) {
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

        return await nanoPromise.insertDocument(this._db, doc);
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
        if (!isOwner(doc.$owners, user)) {
            debug.trace('not allowed to delete group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }

        // TODO Change entries which have this group
        return await nanoPromise.destroyDocument(this._db, doc._id);
    }

    async createGroup(groupName, user, rights) {
        debug(`createGroup (${groupName}, ${user})`);
        if (!Array.isArray(rights)) rights = ['read'];

        await this.open();

        const hasRight = await checkRightAnyGroup(this._db, user, 'createGroup');
        if (!hasRight) throw new CouchError(`user ${user} does not have createGroup right`);

        const group = await getGroup(this._db, groupName);
        if (group) throw new CouchError(`group ${groupName} already exists`, 'exists');

        return await nanoPromise.insertDocument(this._db, {
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
        if (!isOwner(doc.$owners, user)) {
            debug.trace('not allowed to get group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }
        return doc;
    }

    /**
     * Returns a list of groups that grant a given right to the user
     * @param user
     * @param right
     */
    async getGroupsByRight(user, right) {
        debug.trace(`getGroupsByRight (${user}, ${right})`);
        await this.open();
        // Search in default groups
        const defaultGroups = await getDefaultGroups(this._db, user, true);
        // Search inside groups
        const userGroups  = await nanoPromise.queryView(this._db, 'groupByUserAndRight', {key: [user, right]}, {onlyValue: true});
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
    if (!security.admins || security.admins.names.indexOf(admin) === -1) {
        throw new CouchError(`${admin} is not an admin of ${db.config.db}`, 'fatal');
    }
}

async function checkDesignDoc(db, custom) {
    debug.trace('check design doc');
    const doc = await nanoPromise.getDocument(db, constants.DESIGN_DOC_ID);
    if (doc === null) {
        debug.trace('design doc missing');
        return await createDesignDoc(db, null, custom);
    }
    if (
        (!doc.version || doc.version < constants.DESIGN_DOC_VERSION) ||
        (custom && (!doc.customVersion || doc.customVersion < custom.version))
    ) {
        debug.trace('design doc needs update');
        return await createDesignDoc(db, doc._rev, custom);
    }
}

async function createDesignDoc(db, revID, custom) {
    debug.trace('create design doc');
    const designDoc = getDesignDoc(custom);
    if (revID) {
        designDoc._rev = revID;
    }
    return await nanoPromise.insertDocument(db, designDoc);
}

async function getOwnersById(db, id) {
    return await nanoPromise.queryView(db, 'ownersById', {key: id});
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

async function getGroup(db, name) {
    debug.trace('get group');
    const groups = await nanoPromise.queryView(db, 'groupByName', {key: name, reduce: false, include_docs: true});
    if (!groups || groups.length === 0) {
        debug.trace('group does not exist');
        return null;
    }
    if (groups.length > 1) {
        debug.warn('Getting more than one result for a group name');
    }
    debug.trace('group exists');
    return groups[0].doc;
}

async function createNew(ctx, entry, user) {
    debug.trace('create new');
    const ok = await checkGlobalRight(ctx._db, user, 'create');
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
        return await saveEntry(ctx._db, newEntry, user);
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
        return await createRightsDoc(db, rights);
    }
}

async function createRightsDoc(db, rightsDoc) {
    return await nanoPromise.insertDocument(db, rightsDoc);
}

async function checkDefaultGroupsDoc(db) {
    debug.trace('check defaultGroups doc');
    const doc = await nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID);
    if (doc === null) {
        debug.trace('defaultGroups doc does not exist');
        return await nanoPromise.insertDocument(db, {
            _id: constants.DEFAULT_GROUPS_DOC_ID,
            $type: 'db',
            anonymous: [],
            anyuser: []
        });
    }
}

async function checkGlobalRight(db, user, right) {
    debug.trace(`checkGlobalRight (${user}, ${right})`);
    const result = await nanoPromise.queryView(db, 'globalRight', {key: right}, {onlyValue: true});
    for (var i = 0; i < result.length; i++) {
        if (result[i] === 'anonymous' || result[i] === user || result[i] === 'anyuser' && user !== 'anonymous') {
            debug.trace(`user ${user} has global right`);
            return true;
        }
    }
    debug.trace(`user ${user} does not have global right`);
    return false;
}

async function checkRightAnyGroup(db, user, right) {
    debug.trace(`checkRightAnyGroup (${user}, ${right}`);
    const hasGlobal = await checkGlobalRight(db, user, right);
    if (hasGlobal) return true;

    const defaultGroups = await getDefaultGroups(db, user);
    for (let i = 0; i < defaultGroups.length; i++) {
        if (defaultGroups[i].rights.indexOf(right) !== -1) {
            return true;
        }
    }

    const result = await nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, right]});
    return result.length > 0;
}

async function getDefaultGroups(db, user, listOnly) {
    debug.trace('getDefaultGroups');
    const defaultGroups = await nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID);
    const toGet = new Set();
    for (let i = 0; i < defaultGroups.anonymous.length; i++) {
        toGet.add(defaultGroups.anonymous[i]);
    }
    if (user !== 'anonymous') {
        for (let i = 0; i < defaultGroups.anyuser.length; i++) {
            toGet.add(defaultGroups.anyuser[i]);
        }
    }

    if (listOnly) {
        return Array.from(toGet);
    } else {
        return await Promise.all(Array.from(toGet).map(group => getGroup(db, group)));
    }
}

function getDefaultEntry() {
    return {};
}

async function getUser(db, user) {
    const rows = await nanoPromise.queryView(db, 'user', {key: user, include_docs: true});
    if (!rows.length) throw new CouchError('User not found', 'not found');
    if (rows.length > 1) throw new CouchError('Unexepected: more than 1 user profile', 'unreachable');
    return rows[0].doc;
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
    return async function(entry) {
        if (entry._attachments && entry._attachments[name]) {
            return await nanoPromise.getAttachment(ctx._db, entry._id, name, asStream, {rev: entry._rev});
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

function simpleMerge(source, target) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
    return target;
}
