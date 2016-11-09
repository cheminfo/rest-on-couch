'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:user');
const nanoPromise = require('../util/nanoPromise');
const simpleMerge = require('../util/simpleMerge');

const methods = {
    async editUser(user, data) {
        debug(`edit user (${user})`);
        if (typeof data !== 'object' || data === null) {
            throw new CouchError('user data should be an object', 'bad argument');
        }
        await this.open();
        try {
            const userDoc = await getUser(this._db, user);
            data = simpleMerge(data, userDoc);
        } catch (e) {
            if (e.reason !== 'not found') {
                throw e;
            }
        }

        data.$type = 'user';
        data.user = user;
        return nanoPromise.insertDocument(this._db, data);
    },

    async getUser(user) {
        debug(`get user (${user})`);
        await this.open();
        return getUser(this._db, user);
    }
};

async function getUser(db, user) {
    const rows = await nanoPromise.queryView(db, 'user', {key: user, include_docs: true});
    if (!rows.length) throw new CouchError('user not found', 'not found');
    if (rows.length > 1) throw new CouchError('unexepected: more than 1 user profile', 'unreachable');
    return rows[0].doc;
}

module.exports = {
    methods
};