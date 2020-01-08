'use strict';

const _ = require('lodash');

const ldapSearch = require('../util/LDAP').search;
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:group');
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
      throw new CouchError(
        'edit default group invalid group name',
        'bad argument',
      );
    }

    const doc = await this._db.getDocument(constants.DEFAULT_GROUPS_DOC_ID);
    if (!doc) {
      throw new Error(
        'default groups document should always exist',
        'unreachable',
      );
    }
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

    return this._db.insertDocument(doc);
  },

  addDefaultGroup(group, type) {
    return this.editDefaultGroup(group, type, 'add');
  },

  removeDefaultGroup(group, type) {
    return this.editDefaultGroup(group, type, 'remove');
  },

  async deleteGroup(groupName, user) {
    debug('deleteGroup (%s, %s)', groupName, user);
    await this.open();

    const doc = await nanoMethods.getGroup(this._db, groupName);
    if (!doc) {
      debug.trace('group does not exist');
      throw new CouchError('group does not exist', 'not found');
    }
    if (!validate.isOwner(doc.$owners, user)) {
      debug.trace('not allowed to delete group');
      throw new CouchError(
        `user ${user} is not an owner of the group`,
        'unauthorized',
      );
    }

    // TODO Change entries which have this group
    return this._db.destroyDocument(doc._id);
  },

  async createGroup(groupName, user, rights, groupType) {
    debug('createGroup (%s, %s)', groupName, user);
    if (!Array.isArray(rights)) rights = [];

    await this.open();

    const hasRight = await validate.checkRightAnyGroup(
      this,
      user,
      'createGroup',
    );
    if (!hasRight) {
      throw new CouchError(`user ${user} does not have createGroup right`);
    }

    const group = await nanoMethods.getGroup(this._db, groupName);
    if (group) {
      throw new CouchError(`group ${groupName} already exists`, 'conflict');
    }

    return nanoMethods.saveGroup(
      this._db,
      {
        $type: 'group',
        groupType: groupType || 'default',
        $owners: [user],
        name: groupName,
        users: [],
        rights: rights,
      },
      user,
    );
  },

  async getGroup(groupName, user) {
    debug('getGroup (%s, %s)', groupName, user);
    await this.open();
    const doc = await nanoMethods.getGroup(this._db, groupName);
    if (!doc) {
      debug.trace('group does not exist');
      throw new CouchError('group does not exist', 'not found');
    }
    if (!this.isSuperAdmin(user) && !validate.isOwner(doc.$owners, user)) {
      debug.trace('not allowed to get group');
      throw new CouchError(
        `user ${user} is not an owner of the group`,
        'unauthorized',
      );
    }
    return doc;
  },

  /**
   * Returns the list of groups that the user is allowed to read
   * @param {string} user
   * @return {Array}
   */
  async getGroups(user) {
    debug.trace('getGroups (%s)', user);
    await this.open();
    const ok = await validate.checkGlobalRight(this, user, 'readGroup');
    if (ok) {
      return this._db.queryView(
        'documentByType',
        { key: 'group', include_docs: true },
        { onlyDoc: true },
      );
    } else {
      return this.getDocsAsOwner(user, 'group', { onlyDoc: true });
    }
  },

  /**
   * Returns a list of groups that grant a given right to the user
   * @param {string} user
   * @param {string} right
   * @return {Array}
   */
  async getGroupsByRight(user, right) {
    debug.trace('getGroupsByRight (%s, %s)', user, right);
    await this.open();
    // Search in default groups
    const defaultGroups = await validate.getDefaultGroups(this._db, user, true);
    // Search inside groups
    const userGroups = await this._db.queryView(
      'groupByUserAndRight',
      { key: [user, right] },
      { onlyValue: true },
    );
    // Merge both lists
    return _.union(defaultGroups, userGroups);
  },

  async addUsersToGroup(uuid, user, usernames) {
    debug('addUserToGroup (%s, %s, %o)', uuid, user, usernames);
    await this.open();
    usernames = util.ensureUsersArray(usernames);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    group.users = _.union(group.users, usernames);
    return nanoMethods.save(this._db, group, user);
  },

  async removeUsersFromGroup(uuid, user, usernames) {
    debug('removeUsersFromGroup (%s, %s, %o)', uuid, user, usernames);
    await this.open();
    usernames = util.ensureUsersArray(usernames);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    _.pullAll(group.users, usernames);
    return nanoMethods.save(this._db, group, user);
  },

  async addRightsToGroup(uuid, user, rights) {
    debug('addRightsToGroup (%s, %s, %o)', uuid, user, rights);
    await this.open();
    rights = util.ensureRightsArray(rights);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    group.rights = _.union(group.rights, rights);
    return nanoMethods.save(this._db, group, user);
  },

  async removeRightsFromGroup(uuid, user, rights) {
    debug('removeRightsFromGroup (%s, %s, %o)', uuid, user, rights);
    await this.open();
    rights = util.ensureRightsArray(rights);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    _.pullAll(group.rights, rights);
    return nanoMethods.save(this._db, group, user);
  },

  async setGroupProperties(uuid, user, properties = {}) {
    debug('setGroupProperties (%s, %s, %o)', uuid, user, properties);
    await this.open();
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    if (properties.description) {
      group.description = properties.description;
    }
    return nanoMethods.save(this._db, group, user);
  },

  async setLdapGroupProperties(uuid, user, properties = {}) {
    debug('setLdapGroupProperties (%s, %s, %o)', uuid, user, properties);
    await this.open();
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    if (group.groupType !== 'ldap') {
      throw new CouchError(
        'Cannot set ldap group properties on non-ldap group',
        'bad argument',
      );
    }
    if (properties.filter) {
      group.filter = properties.filter;
    }
    if (properties.DN) {
      group.DN = properties.DN;
    }
    return nanoMethods.save(this._db, group, user);
  },

  async syncLdapGroup(uuid, user) {
    debug.trace('sync LDAP group (%s, %s)', uuid, user);
    await this.open();
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    if (group.groupType !== 'ldap') {
      throw new CouchError('Cannot sync ldap group', 'bad argument');
    }
    await syncOneLdapGroup(this, group);
  },

  async syncLDAPGroups(groups) {
    debug('sync LDAP groups in database %s', this._db.dbName);
    await this.open();
    // Find all the ldap groups
    debug.trace('sync all ldap groups');
    groups = await this._db.queryView(
      'documentByType',
      {
        key: 'group',
        include_docs: true,
      },
      { onlyDoc: true },
    );

    groups = groups.filter((group) => group.DN);
    for (let i = 0; i < groups.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await syncOneLdapGroup(this, groups[i]);
    }
  },
};

async function syncOneLdapGroup(ctx, group) {
  debug.trace('sync ldap group %s', group._id);
  const couchOptions = ctx._couchOptions;
  const entries = await ldapSearch(
    {
      url: couchOptions.ldapUrl,
      bindDN: couchOptions.ldapBindDN,
      bindPassword: couchOptions.ldapBindPassword,
    },
    {
      DN: group.DN,
      filter: group.filter,
    },
  );

  let emails = [];
  entries.forEach((entry) => {
    let user = entry.object;
    // Custom email extraction
    if (user) {
      emails.push(
        ...util.ensureUsersArray(couchOptions.ldapGetUserEmail(user)),
      );
    } else {
      debug.error('ldap entry does not have "object" property');
    }
  });

  // Check if changed to avoid many revisions
  if (!arraysAreEqual(emails, group.users)) {
    group.users = emails;
    await nanoMethods.save(ctx._db, group, 'ldap');
  }
  debug('ldap sync success');
}

function arraysAreEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  arr1 = arr1.slice().sort();
  arr2 = arr2.slice().sort();
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

module.exports = {
  methods,
};
