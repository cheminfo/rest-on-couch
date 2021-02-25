'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:token');
const token = require('../util/token');

const { isValidUsername, ensureRightsArray } = require('./util');

const methods = {
  async createEntryToken(user, uuid, rights = ['read']) {
    debug('createEntryToken (%s, %s)', user, uuid);
    if (!isValidUsername(user)) {
      throw new CouchError('only a user can create a token', 'unauthorized');
    }
    ensureRightsArray(rights);
    await this.open();
    // We need write right to create a token. This will throw if not.
    await this.getEntryWithRights(uuid, user, 'write');
    return token.createEntryToken(this._db, user, uuid, rights);
  },

  async createUserToken(user, rights = ['read']) {
    debug('createUserToken (%s)', user);
    if (!isValidUsername(user)) {
      throw new CouchError('only a user can create a token', 'unauthorized');
    }
    ensureRightsArray(rights);
    await this.open();
    return token.createUserToken(this._db, user, rights);
  },

  async deleteToken(user, tokenId) {
    debug('deleteToken (%s, %s)', user, tokenId);
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
    debug('getToken (%s)', tokenId);
    await this.open();
    const tokenValue = await token.getToken(this._db, tokenId);
    if (!tokenValue) {
      throw new CouchError('token not found', 'not found');
    }
    return tokenValue;
  },

  async getTokens(user) {
    debug('getTokens (%s)', user);
    await this.open();
    return token.getTokens(this._db, user);
  },
};

module.exports = {
  methods,
};
