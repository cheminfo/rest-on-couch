'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:entry');
const nanoPromise = require('../util/nanoPromise');
const validate = require('./validate');

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
    }
};

async function getOwnersById(db, id) {
    return nanoPromise.queryView(db, 'ownersById', {key: id});
}

module.exports = {
    methods
};
