'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:entry');
const nanoPromise = require('../util/nanoPromise');
const validate = require('./validate');
const nanoMethods = require('./nano');

const methods = {
    async getEntryByIdAndRights(id, user, rights, options = {}) {
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

        if (await validate.validateTokenOrRights(this._db, hisEntry.id, hisEntry.value, rights, user, options.token)) {
            debug.trace(`user ${user} has access`);
            return nanoPromise.getDocument(this._db, hisEntry.id, options);
        }

        debug.trace(`user ${user} has no ${rights} access`);
        throw new CouchError('user has no access', 'unauthorized');
    },

    async getEntryByUuidAndRights(uuid, user, rights, options = {}) {
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
        if (await validate.validateTokenOrRights(this._db, uuid, doc.$owners, rights, user, options.token)) {
            debug.trace(`user ${user} has access`);
            if (!options) {
                return doc;
            } else {
                return nanoPromise.getDocument(this._db, uuid, options);
            }
        }

        debug.trace(`user ${user} has no ${rights} access`);
        throw new CouchError('user has no access', 'unauthorized');
    },

    async deleteEntryByUuid(uuid, user) {
        debug(`deleteEntryByUuid (${uuid}, ${user})`);
        await this.getEntryByUuidAndRights(uuid, user, 'delete');
        return nanoPromise.destroyDocument(this._db, uuid);
    },

    async deleteEntryById(id, user) {
        debug(`deleteEntryById (${id}, ${user})`);
        const doc = await this.getEntryByIdAndRights(id, user, 'delete');
        return nanoPromise.destroyDocument(this._db, doc._id);
    },

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
            return nanoMethods.saveEntry(this._db, toInsert, user);
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
};

async function getOwnersById(db, id) {
    return nanoPromise.queryView(db, 'ownersById', {key: id});
}

module.exports = {
    methods
};
