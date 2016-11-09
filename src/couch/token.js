'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:token');
const token = require('../util/token');

const methods = {
    async createEntryToken(user, uuid) {
        debug(`createEntryToken (${user}, ${uuid})`);
        await this.open();
        // We need write right to create a token. This will throw if not.
        await this.getEntryByUuidAndRights(uuid, user, 'write');
        return token.createEntryToken(this._db, user, uuid, 'read');
    },

    async deleteToken(user, tokenId) {
        debug(`deleteToken (${user}, ${tokenId})`);
        await this.open();
        const tokenValue = await token.getToken(this._db, tokenId);
        if (!tokenValue) {
            throw new CouchError('token not found', 'not found');
        }
        if (tokenValue.$owner !== user) {
            throw new CouchError('only owner can delete a token', 'unauthorized');
        }
        await token.destroyToken(this._db, tokenValue._id, tokenValue._rev);
    },

    async getToken(tokenId) {
        debug(`getToken (${tokenId})`);
        await this.open();
        const tokenValue = await token.getToken(this._db, tokenId);
        if (!tokenValue) {
            throw new CouchError('token not found', 'not found');
        }
        return tokenValue;
    },

    async getTokens(user) {
        debug(`getTokens (${user})`);
        await this.open();
        return token.getTokens(this._db, user);
    }
};

module.exports = {
    methods
};
