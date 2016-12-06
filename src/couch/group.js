'use strict';

const _ = require('lodash');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:group');
const nanoPromise = require('../util/nanoPromise');

const constants = require('../constants');
const nanoMethods = require('./nano');
const util = require('./util');
const validate = require('./validate');

const methods = {
    async editDefaultGroup(group, type, action) {
        if (action !== 'add' && action !== 'remove') {
            throw new CouchError('edit default group invalid action', 'bad argument');
        }
        if (!util.isSpecialUser(type)) {
            throw new CouchError('edit default group invalid type', 'bad argument');
        }
        if (!util.isValidGroupName(group)) {
            throw new CouchError('edit default group invalid group name', 'bad argument');
        }

        const doc = await nanoPromise.getDocument(this._db, constants.DEFAULT_GROUPS_DOC_ID);
        if (!doc) throw new Error('default groups document should always exist', 'unreachable');
        if (action === 'add') {
            if (!doc[type]) doc[type] = [];
            if (doc[type].indexOf(group) === -1) {
                doc[type].push(group);
            }
        }
        if (action === 'remove') {
            if (doc[type]) {
                const idx = doc[type].indexOf(group);
                if (idx !== -1) {
                    doc[type].splice(idx, 1);
                }
            }
        }

        return nanoPromise.insertDocument(this._db, doc);
    },

    addDefaultGroup(group, type) {
        return this.editDefaultGroup(group, type, 'add');
    },

    removeDefaultGroup(group, type) {
        return this.editDefaultGroup(group, type, 'remove');
    },

    async deleteGroup(groupName, user) {
        debug(`deleteGroup (${groupName}, ${user})`);
        await this.open();

        const doc = await nanoMethods.getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!validate.isOwner(doc.$owners, user)) {
            debug.trace('not allowed to delete group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }

        // TODO Change entries which have this group
        return nanoPromise.destroyDocument(this._db, doc._id);
    },

    async createGroup(groupName, user, rights) {
        debug(`createGroup (${groupName}, ${user})`);
        if (!Array.isArray(rights)) rights = [];

        await this.open();

        const hasRight = await validate.checkRightAnyGroup(this, user, 'createGroup');
        if (!hasRight) throw new CouchError(`user ${user} does not have createGroup right`);

        const group = await nanoMethods.getGroup(this._db, groupName);
        if (group) throw new CouchError(`group ${groupName} already exists`, 'conflict');

        return nanoMethods.saveGroup(this._db, {
            $type: 'group',
            $owners: [user],
            name: groupName,
            users: [],
            rights: rights
        }, user);
    },

    async getGroup(groupName, user) {
        debug(`getGroup (${groupName}, ${user})`);
        await this.open();
        const doc = await nanoMethods.getGroup(this._db, groupName);
        if (!doc) {
            debug.trace('group does not exist');
            throw new CouchError('group does not exist', 'not found');
        }
        if (!this.isAdmin(user) && !validate.isOwner(doc.$owners, user)) {
            debug.trace('not allowed to get group');
            throw new CouchError(`user ${user} is not an owner of the group`, 'unauthorized');
        }
        return doc;
    },

    /**
     * Returns a list of groups that grant a given right to the user
     * @param {string} user
     * @param {string} right
     * @return {Array}
     */
    async getGroupsByRight(user, right) {
        debug.trace(`getGroupsByRight (${user}, ${right})`);
        await this.open();
        // Search in default groups
        const defaultGroups = await validate.getDefaultGroups(this._db, user, true);
        // Search inside groups
        const userGroups = await nanoPromise.queryView(this._db, 'groupByUserAndRight', {key: [user, right]}, {onlyValue: true});
        // Merge both lists
        return _.union(defaultGroups, userGroups);
    },

    async addUsersToGroup(uuid, user, usernames) {
        debug(`addUserToGroup (${uuid}, ${user}, ${usernames})`);
        await this.open();
        usernames = util.ensureUsersArray(usernames);
        const group = await this.getDocByRights(uuid, user, 'write', 'group');
        group.users = _.union(group.users, usernames);
        return nanoMethods.save(this._db, group, user);
    },

    async removeUsersFromGroup(uuid, user, usernames) {
        debug(`removeUsersFromGroup (${uuid}, ${user}, ${usernames})`);
        await this.open();
        usernames = util.ensureUsersArray(usernames);
        const group = await this.getDocByRights(uuid, user, 'write', 'group');
        _.pullAll(group.users, usernames);
        return nanoMethods.save(this._db, group, user);
    },

    async addRightsToGroup(uuid, user, rights) {
        debug(`addRightsToGroup (${uuid}, ${user}, ${rights})`);
        await this.open();
        rights = util.ensureRightsArray(rights);
        const group = await this.getDocByRights(uuid, user, 'write', 'group');
        group.rights = _.union(group.rights, rights);
        return nanoMethods.save(this._db, group, user);
    },

    async removeRightsFromGroup(uuid, user, rights) {
        debug(`removeRightsFromGroup (${uuid}, ${user}, ${rights})`);
        await this.open();
        rights = util.ensureRightsArray(rights);
        const group = await this.getDocByRights(uuid, user, 'write', 'group');
        _.pullAll(group.rights, rights);
        return nanoMethods.save(this._db, group, user);
    }
};

module.exports = {
    methods
};
