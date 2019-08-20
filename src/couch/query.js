'use strict';

const _ = require('lodash');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:query');
const ensureStringArray = require('../util/ensureStringArray');

const validateMethods = require('./validate');

const methods = {
  async queryEntriesByRight(user, view, right, options) {
    debug('queryEntriesByRight (%s, %s, %s)', user, view, right);
    await this.open();
    options = options || {};
    if (!this._viewsWithOwner.has(view)) {
      throw new CouchError(`${view} is not a view with owner`, 'unauthorized');
    }
    right = right || 'read';

    user = validateMethods.userFromTokenAndRights(user, options.token, [right]);

    // First check if user has global right
    const hasGlobalRight = await validateMethods.checkGlobalRight(
      this,
      user,
      right,
    );
    if (hasGlobalRight) {
      // When there is a global right, we cannot use queries because the first element of the
      // key will match all documents
      const result = await this._db.queryView(view, {
        reduce: false,
      });
      return _.uniqBy(result, 'id');
    }

    var userGroups = await this.getGroupsByRight(user, right);
    userGroups.push(user);
    if (options.groups) {
      var groupsToUse = [];
      if (!Array.isArray(options.groups)) {
        options.groups = [options.groups];
      }
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
    const userStartKey =
      options.key !== undefined
        ? options.key
        : options.startkey !== undefined
        ? options.startkey
        : [];
    const userEndKey =
      options.key !== undefined
        ? options.key
        : options.endkey !== undefined
        ? options.endkey
        : [];

    for (const group of userGroups) {
      const startkey = [group].concat(userStartKey);
      const endkey = [group].concat(userEndKey);
      endkey.push({});
      // eslint-disable-next-line no-await-in-loop
      const result = await this._db.queryView(view, {
        include_docs: options.include_docs,
        startkey,
        endkey,
        reduce: false,
      });
      for (const el of result) {
        if (!data.has(el.id)) {
          data.set(el.id, el);
        }
      }
    }
    return Array.from(data.values());
  },

  /*
     Like queryViewByUser but only entries are returned
     Since custom design views might emit for non-entries we
     need to ensure those are not returned to non-admin users
     */
  async queryEntriesByUser(user, view, options, rights) {
    const docs = await this.queryViewByUser(user, view, options, rights);
    return docs.filter((doc) => doc.$type === 'entry');
  },

  async queryViewByUser(user, view, options, rights = 'read') {
    debug('queryViewByUser (%s, %s)', user, view);
    options = Object.assign({}, options);
    rights = ensureStringArray(rights, 'rights');
    user = validateMethods.userFromTokenAndRights(user, options.token, rights);

    await this.open();
    if (options.reduce) {
      if (this._viewsWithOwner.has(view)) {
        // We don't allow this. Reduce with emit owner make little sense
        // since each document can be emited more than once...
        throw new CouchError(`${view} is a view with owner`, 'unauthorized');
      }
      // !! if reduce we bypass security
      // Reduce should not contain sensible data
      return this._db.queryView(view, options);
    }

    options.include_docs = true;
    options.skip = 0;
    var limit = options.limit || 1;
    var cumRows = [];
    while (cumRows.length < limit) {
      // eslint-disable-next-line no-await-in-loop
      let rows = await this._db.queryView(view, options);
      // No more results
      if (!rows.length) break;

      let owners = rows.map((r) => r.doc.$owners);
      // eslint-disable-next-line no-await-in-loop
      let hasRights = await validateMethods.validateRights(
        this,
        owners,
        user,
        rights,
      );
      rows = rows.map((entry) => entry.doc);
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
  },
};

module.exports = {
  methods,
};
