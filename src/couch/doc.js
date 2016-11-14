'use strict';

const _ = require('lodash');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:doc');
const nanoPromise = require('../util/nanoPromise');
const util = require('./util');
const validate = require('./validate');
const nanoMethods = require('./nano');
const ensureStringArray = require('../util/ensureStringArray');

const methods = {
    async getDocByRights(idOrUuid, user, rights, options) {
        await this.open();
        debug.trace('getDocByRights');
        if (!util.isManagedDocumentType(options.type)) {
            throw new CouchError(`invalid document type: ${options.type}`);
        }

        let uuid;
        if (idOrUuid.id) {
            uuid = await nanoMethods.getUuidFromId(this._db, idOrUuid.id, options.type, user);
        } else if (idOrUuid.uuid) {
            uuid = idOrUuid.uuid;
        } else {
            throw new CouchError('missing id or uuid');
        }


        const doc = await nanoPromise.getDocument(this._db, uuid);
        if (!doc) {
            throw new CouchError('document not found', 'not found');
        }
        if (doc.$type !== options.type) {
            throw new CouchError(`wrong document type: ${doc.$type}. Expected: ${options.type}`);
        }

        if (await validate.validateTokenOrRights(this._db, uuid, doc.$owners, rights, user, options.token, options.type)) {
            return nanoPromise.getDocument(this._db, uuid, options);
        }
        throw new CouchError('user has no access', 'unauthorized');
    },

    async addOwnersToDoc(idOrUuid, user, owners, options) {
        await this.open();
        debug.trace('addOwnersToDoc');
        owners = ensureOwnersArray(owners);
        const doc = await this.getDocByRights(idOrUuid, user, 'owner', options);
        doc.$owners = _.union(doc.$owners, owners);
        return nanoMethods.save(this._db, doc, user);
    },

    async removeOwnersFromDoc(idOrUuid, user, owners, options) {
        await this.open();
        debug.trace('removeOwnersFromDoc');
        owners = ensureOwnersArray(owners);
        const doc = await this.getDocByRights(idOrUuid, user, 'owner', options);
        const newArray = _.pullAll(doc.$owners.slice(1), owners);
        newArray.unshift(doc.$owners[0]);
        doc.$owners = newArray;
        return nanoMethods.save(this._db, doc, user);
    }
};

function ensureOwnersArray(owners) {
    owners = ensureStringArray(owners);
    for (const owner of owners) {
        if (!util.isValidOwner(owner)) {
            throw new CouchError(`invalid owner: ${owner}`, 'invalid');
        }
    }
    return owners;
}

module.exports = {
    methods
};
