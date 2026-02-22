'use strict';

const constants = require('../constants');
const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:right');

const nano = require('./nano');
const util = require('./util');
const { union, difference } = require('../util/array_sets.js');

const methods = {
  async editGlobalRight(user, type, target, action) {
    await this.open();
    checkAdmin(this, user);
    if (action !== 'add' && action !== 'remove') {
      throw new CouchError('Edit global right invalid action', 'bad argument');
    }

    checkGlobalType(type);
    checkGlobalUser(target);

    const doc = await getGlobalRightsDocument(this);
    let hasChanged = false;
    if (action === 'add') {
      if (!doc[type]) doc[type] = [];
      if (!doc[type].includes(target)) {
        doc[type].push(target);
        hasChanged = true;
      }
    }
    if (action === 'remove') {
      if (doc[type]) {
        const idx = doc[type].indexOf(target);
        if (idx !== -1) {
          doc[type].splice(idx, 1);
          hasChanged = true;
        }
      }
    }

    if (hasChanged) {
      return this._db.insertDocument(doc);
    } else {
      return null;
    }
  },

  addGlobalRight(user, type, target) {
    debug('addGlobalRight (%s, %s, %s)', user, type, target);
    return this.editGlobalRight(user, type, target, 'add');
  },

  removeGlobalRight(user, type, target) {
    debug('removeGlobalRight (%s, %s, %s)', user, type, target);
    return this.editGlobalRight(user, type, target, 'remove');
  },

  async getGlobalRightsDocument(user) {
    await this.open();
    debug('getGlobalRightsDocument (%s)', user);
    checkAdmin(this, user);
    return getGlobalRightsDocument(this);
  },

  async getGlobalRightUsers(user, type) {
    await this.open();
    debug('getGlobalRightUsers (%s, %s)', user, type);
    checkAdmin(this, user);
    checkGlobalType(type);
    const doc = await getGlobalRightsDocument(this);
    return doc[type] || [];
  },

  async getGlobalDefaultGroups(user) {
    await this.open();
    debug('getGlobalDefaultGroups (%s)', user);
    checkAdmin(this, user);
    return getDefaultGroupsDocument(this);
  },

  async setGlobalDefaultGroups(user, data) {
    await this.open();
    debug('setGlobalDefaultGroups (%s)', user);
    checkAdmin(this, user);
    if (!data) {
      throw new CouchError('Missing data', 'invalid');
    }
    const doc = await getDefaultGroupsDocument(this);
    doc.anonymous = data.anonymous;
    doc.anyuser = data.anyuser;
    return this._db.insertDocument(doc);
  },

  async editGlobalDefaultGroup(user, genUser, group, action) {
    await this.open();
    debug('addGlobalDefaultGroup (%s, %s, %s)', user, genUser, group);
    if (action !== 'add' && action !== 'remove') {
      throw new CouchError(
        'Edit global default group invalid action',
        'bad argument',
      );
    }
    checkAdmin(this, user);
    if (!util.isSpecialUser(genUser)) {
      throw new CouchError('User is not a valid special user', 'bad argument');
    }
    const doc = await getDefaultGroupsDocument(this);
    if (action === 'add') {
      doc[genUser] = union(doc[genUser], [group]);
    } else {
      doc[genUser] = difference(doc[genUser], [group]);
    }
    return this._db.insertDocument(doc);
  },

  async removeGlobalDefaultGroup(user, genUser, group) {
    await this.open();
    debug('removeGlobalDefaultGroup (%s, %s, %s)', user, genUser, group);
    return this.editGlobalDefaultGroup(user, genUser, group, 'remove');
  },

  async addGlobalDefaultGroup(user, genUser, group) {
    await this.open();
    debug('addGlobalDefaultGroup (%s, %s, %s)', user, genUser, group);
    return this.editGlobalDefaultGroup(user, genUser, group, 'add');
  },

  /**
   * Returns a list of the rights that the given user has globally
   * @param {string} user
   * @return {Array}
   */
  async getGlobalRights(user) {
    await this.open();
    if (this.isSuperAdmin(user)) {
      return union(constants.globalRightTypes, constants.globalAdminRightTypes);
    } else {
      const globalRightsDoc = await getGlobalRightsDocument(this);
      const globalRightsKeys = Object.keys(globalRightsDoc).filter((key) =>
        constants.globalRightTypes.includes(key),
      );
      const userRights = new Set();
      for (const right of globalRightsKeys) {
        const users = globalRightsDoc[right];
        if (Array.isArray(users)) {
          if (
            users.includes('anonymous') ||
            (user !== 'anonymous' && users.includes('anyuser')) ||
            users.includes(user)
          ) {
            userRights.add(right);
            break;
          }
        }
      }

      const defaultGroupsDoc = await getDefaultGroupsDocument(this);
      const defaultGroups = new Set(defaultGroupsDoc.anonymous);
      if (user !== 'anonymous') {
        defaultGroupsDoc.anyuser.forEach((group) => defaultGroups.add(group));
      }

      for (const group of defaultGroups) {
        const groupObject = await nano.getGroup(this._db, group);
        if (groupObject && groupObject.rights) {
          groupObject.rights.forEach((group) => defaultGroups.add(group));
        }
      }

      const finalRights = Array.from(userRights);
      return this.isAdmin(user)
        ? union(finalRights, constants.globalAdminRightTypes)
        : finalRights;
    }
  },

  async hasRightForEntry(uuid, user, right, options) {
    debug('has right for entry (%s, %s, %s)', uuid, user, right);
    await this.open();
    try {
      await this.getEntryWithRights(uuid, user, right, options);
      return true;
    } catch (e) {
      if (e.reason === 'unauthorized') return false;
      // Propagate
      throw e;
    }
  },

  isAdmin(user) {
    return this._administrators.includes(user) || this.isSuperAdmin(user);
  },

  isSuperAdmin(user) {
    return this._superAdministrators.includes(user);
  },
};

async function getDefaultGroupsDocument(couch) {
  const doc = await couch._db.getDocument(constants.DEFAULT_GROUPS_DOC_ID);
  if (!doc) {
    throw new Error(
      'Default groups document should always exist',
      'unreachable',
    );
  }
  return doc;
}

async function getGlobalRightsDocument(couch) {
  const doc = await couch._db.getDocument(constants.RIGHTS_DOC_ID);
  if (!doc) {
    throw new Error('Rights document should always exist', 'unreachable');
  }
  return doc;
}

function checkGlobalType(type) {
  if (!util.isValidGlobalRightType(type)) {
    throw new CouchError('Invalid global right type', 'bad argument');
  }
}

function checkGlobalUser(user) {
  if (!util.isValidGlobalRightUser(user)) {
    throw new CouchError('Invalid global right user', 'bad argument');
  }
}

function checkAdmin(ctx, user) {
  if (!ctx.isAdmin(user)) {
    throw new CouchError(
      'Restricted to database administrators',
      'unauthorized',
    );
  }
}

module.exports = {
  methods,
};
