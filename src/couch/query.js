'use strict';

const _ = require('lodash');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:query');
const nanoPromise = require('../util/nanoPromise');
const validateMethods = require('./validate');

const methods = {
    async queryEntriesByRight(user, view, right, options) {
        debug(`queryEntriesByRights (${user}, ${view}, ${right})`);
        await this.open();
        options = options || {};
        if (!this._viewsWithOwner.has(view)) {
            throw new CouchError(`${view} is not a view with owner`, 'unauthorized');
        }
        right = right || 'read';

        // First check if user has global right
        const hasGlobalRight = await validateMethods.checkGlobalRight(this, user, right);
        if (hasGlobalRight) {
            // When there is a global right, we cannot use queries because the first element of the
            // key will match all documents
            const result = await nanoPromise.queryView(this._db, view, {reduce: false});
            return _.uniqBy(result, 'id');
        }

        var userGroups = await this.getGroupsByRight(user, right);
        userGroups.push(user);
        if (options.groups) {
            var groupsToUse = [];
            if (!Array.isArray(options.groups)) options.groups = [options.groups];
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
    },

    /*
     Like queryViewByUser but only entries are returned
     Since custom design views might emit for non-entries we
     need to ensure those are not returned to non-admin users
     */
    async queryEntriesByUser(user, view, options, rights) {
        const docs = await this.queryViewByUser(user, view, options, rights);
        return docs.filter(doc => doc.$type === 'entry');
    },

    async queryViewByUser(user, view, options, rights) {
        debug(`queryViewByUser (${user}, ${view})`);
        options = Object.assign({}, options);
        await this.open();
        if (options.reduce) {
            if (this._viewsWithOwner.has(view)) {
                // We don't allow this. Reduce with emit owner make little sense
                // since each document can be emited more than once...
                throw new CouchError(`${view} is a view with owner`, 'unauthorized');
            }
            // !! if reduce we bypass security
            // Reduce should not contain sensible data
            return nanoPromise.queryView(this._db, view, options);
        }


        options.include_docs = true;
        options.skip = 0;
        var limit = options.limit || 1;
        var cumRows = [];
        while (cumRows.length < limit) {
            let rows = await nanoPromise.queryView(this._db, view, options);
            // No more results
            if (!rows.length) break;

            let owners = rows.map(r => r.doc.$owners);
            let hasRights = await validateMethods.validateRights(this, owners, user, rights || 'read');
            rows = rows.map(entry => entry.doc);
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
    }
};

module.exports = {
    methods
};
