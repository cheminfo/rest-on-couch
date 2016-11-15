'use strict';

const includes = require('array-includes');
const _ = require('lodash');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:doc');
const nanoPromise = require('../util/nanoPromise');
const util = require('./util');
const validate = require('./validate');
const nanoMethods = require('./nano');

const methods = {
    async getDocUuidFromId(id, user, type) {
        return nanoMethods.getUuidFromId(this._db, id, user, type);
    },

    async getDocByRights(uuid, user, rights, type, options) {
        debug.trace('getDocByRights');
        await this.open();
        if (!util.isManagedDocumentType(type)) {
            throw new CouchError(`invalid type argument: ${type}`);
        }

        const doc = await nanoPromise.getDocument(this._db, uuid);
        if (!doc) {
            throw new CouchError('document not found', 'not found');
        }
        if (doc.$type !== type) {
            throw new CouchError(`wrong document type: ${doc.$type}. Expected: ${type}`);
        }

        const token = options ? options.token : null;
        if (await validate.validateTokenOrRights(this._db, uuid, doc.$owners, rights, user, token, type)) {
            return nanoPromise.getDocument(this._db, uuid, options);
        }
        throw new CouchError('user has no access', 'unauthorized');
    },

    async addOwnersToDoc(uuid, user, owners, type, options) {
        debug.trace('addOwnersToDoc');
        await this.open();
        owners = util.ensureOwnersArray(owners);
        const doc = await this.getDocByRights(uuid, user, 'owner', type, options);
        doc.$owners = _.union(doc.$owners, owners);
        return nanoMethods.save(this._db, doc, user);
    },

    async removeOwnersFromDoc(uuid, user, owners, type, options) {
        debug.trace('removeOwnersFromDoc');
        await this.open();
        owners = util.ensureOwnersArray(owners);
        const doc = await this.getDocByRights(uuid, user, 'owner', type, options);
        const mainOwner = doc.$owners[0];
        if (includes(owners, mainOwner)) {
            throw new CouchError('cannot remove primary owner', 'forbidden');
        }
        const newArray = _.pullAll(doc.$owners.slice(1), owners);
        newArray.unshift(doc.$owners[0]);
        doc.$owners = newArray;
        return nanoMethods.save(this._db, doc, user);
    }
};

module.exports = {
    methods
};
