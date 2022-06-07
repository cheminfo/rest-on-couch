'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:query');
const ensureStringArray = require('../util/ensureStringArray');
const { getUserGroups } = require('../util/groups');

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
      const docIds = new Map();
      const data = [];
      const result = await this._db.queryView(view, {
        reduce: false,
      });
      for (const r of result) {
        const owner = docIds.get(r.id);
        // A document is never added twice for a different owner
        if (owner === undefined || docIds.get(r.id) === r.key[0]) {
          data.push(r);
          docIds.set(r.id, r.key[0]);
        }
      }
      return data;
    }

    const userGroups = await getUserGroups(
      this,
      user,
      right,
      options.groups,
      options.mine,
    );

    const docIds = new Set();
    const data = [];
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
      const result = await this._db.queryView(view, {
        include_docs: Boolean(options.include_docs),
        startkey,
        endkey,
        reduce: false,
      });

      for (const el of result) {
        if (!docIds.has(el.id)) {
          // When the same document emits multiple times in a couchdb view, each
          // emitted value will be added here
          // But only once per owner to prevent from producing the same result multiple times
          data.push(el);
        }
      }
      for (const el of result) {
        docIds.add(el.id);
      }
    }
    return data;
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
      let rows = await this._db.queryView(view, options);
      // No more results
      if (!rows.length) break;

      let owners = rows.map((r) => r.doc.$owners);
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
