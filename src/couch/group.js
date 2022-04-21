'use strict';

const _ = require('lodash');

const constants = require('../constants');
const CouchError = require('../util/CouchError');
const ldapSearch = require('../util/LDAP').search;
const debug = require('../util/debug')('main:group');

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

  async createGroup(groupName, user, rights) {
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
        $owners: [user],
        name: groupName,
        users: [],
        customUsers: [],
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
   * Return info about a specific group
   *
   */
  async getGroupInfo(groupName, user, ldapInfo) {
    debug('getGroupInfo (%s, %s, %s)', groupName, user, ldapInfo);
    await this.open();
    const group = await nanoMethods.getGroup(this._db, groupName);
    if (!group) {
      debug.trace('group does not exist');
      throw new CouchError('group does not exist', 'not found');
    }

    const hasReadGroupRight = await validate.checkGlobalRight(
      this,
      user,
      'readGroup',
    );

    return getGroupInfoResult(this, group, user, hasReadGroupRight, ldapInfo);
  },

  /**
   * Return info about every group
   * @param {*} user
   */
  async getGroupsInfo(user, ldapInfo) {
    debug.trace('getGroupsInfo (%s, %s)', user, ldapInfo);

    if (user === 'anonymous') {
      throw new CouchError(
        'user must be authenticated to get groups info',
        'unauthorized',
      );
    }
    await this.open();

    const groups = await this._db.queryView(
      'documentByType',
      { key: 'group', include_docs: true },
      { onlyDoc: true },
    );

    const hasReadGroupRight = await validate.checkGlobalRight(
      this,
      user,
      'readGroup',
    );

    const result = [];
    for (let group of groups) {
      const groupInfo = await getGroupInfoResult(
        this,
        group,
        user,
        hasReadGroupRight,
        ldapInfo,
      );
      result.push(groupInfo);
    }

    return result;
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
    debug('addUsersToGroup (%s, %s, %o)', uuid, user, usernames);
    await this.open();
    usernames = util.ensureUsersArray(usernames);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    group.customUsers = _.union(group.customUsers, usernames);
    if (arraysAreEqual(group.users, group.customUsers)) {
      return getUnchangedGroupResult(group);
    }
    return syncOneGroup(this, group, user, false);
  },

  async removeUsersFromGroup(uuid, user, usernames) {
    debug('removeUsersFromGroup (%s, %s, %o)', uuid, user, usernames);
    await this.open();
    usernames = util.ensureUsersArray(usernames);
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    _.pullAll(group.customUsers, usernames);
    if (arraysAreEqual(group.users, group.customUsers)) {
      return getUnchangedGroupResult(group);
    }
    return syncOneGroup(this, group, user, false);
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
    let resync = false;
    if (properties.description) {
      group.description = properties.description;
    }
    if (properties.filter) {
      resync = true;
      group.filter = properties.filter;
    }
    if (properties.DN) {
      resync = true;
      group.DN = properties.DN;
    }
    if (resync) {
      return syncOneGroup(this, group, user, false);
    } else {
      return nanoMethods.save(this._db, group, user);
    }
  },

  async syncGroup(uuid, user) {
    debug.trace('sync LDAP group (%s, %s)', uuid, user);
    await this.open();
    const group = await this.getDocByRights(uuid, user, 'write', 'group');
    return syncOneGroup(this, group, user, false);
  },

  async syncGroups() {
    debug('sync users in groups %s', this._db.dbName);
    await this.open();
    // Find all the ldap groups
    const groups = await this._db.queryView(
      'documentByType',
      {
        key: 'group',
        include_docs: true,
      },
      { onlyDoc: true },
    );

    for (let i = 0; i < groups.length; i++) {
      await syncOneGroup(this, groups[i], 'ldap', true);
    }
  },
};

function getUnchangedGroupResult(group) {
  return {
    ok: true,
    isNew: false,
    id: group._id,
    rev: group._rev,
    $modificationDate: group.$modificationDate,
    $creationDate: group.$creationDate,
  };
}

function resetToCustomUsers(ctx, group, user) {
  group.users = group.customUsers;
  return nanoMethods.save(ctx._db, group, user);
}

async function syncOneGroup(ctx, group, user, safe) {
  if (isLdapGroup(group)) {
    try {
      const { result } = await syncOneLdapGroup(ctx, group, user);
      return result;
    } catch (e) {
      debug(e.message);
      if (safe) {
        throw e;
      } else {
        return resetToCustomUsers(ctx, group, user);
      }
    }
  } else {
    return resetToCustomUsers(ctx, group, user);
  }
}

async function syncOneLdapGroup(ctx, group, user) {
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
  let info = [];
  entries.forEach((entry) => {
    let user = entry.object;
    // Custom email extraction
    if (user) {
      if (ctx._getPublicUserInfo) {
        try {
          const userInfo = ctx._getPublicUserInfo(user);
          if (userInfo !== null) {
            info.push(ctx._getPublicUserInfo(user));
          }
        } catch {
          // Do not add anything to info
        }
      }
      emails.push(
        ...util.ensureUsersArray(couchOptions.ldapGetUserEmail(user)),
      );
    } else {
      debug.error('ldap entry does not have "object" property');
    }
  });

  let result;
  // Check if changed to avoid many revisions
  const newUsers = _.union(emails, group.customUsers);
  if (arraysAreEqual(newUsers, group.users)) {
    result = getUnchangedGroupResult(group);
  } else {
    group.users = newUsers;
    result = await nanoMethods.save(ctx._db, group, user);
  }
  return { result, info };
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

function isLdapGroup(group) {
  if (group.DN && group.filter) {
    return true;
  }
  return false;
}

async function getGroupInfoResult(
  ctx,
  group,
  user,
  hasReadGroupRight,
  ldapInfo,
) {
  const additionalProperties =
    hasReadGroupRight ||
    group.users.includes(user) ||
    group.$owners.includes(user)
      ? {
          users: group.users,
          rights: group.rights,
        }
      : {};
  if (ldapInfo) {
    if (isLdapGroup(group)) {
      const { info } = await syncOneLdapGroup(ctx, group, user);
      additionalProperties.ldapInfo = info;
    } else {
      additionalProperties.ldapInfo = [];
    }
  }
  return {
    name: group.name,
    description: group.description,
    ...additionalProperties,
  };
}
