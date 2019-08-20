'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:user');
const simpleMerge = require('../util/simpleMerge');

const nanoMethods = require('./nano');
const validate = require('./validate');

const methods = {
  async editUser(user, data) {
    debug('editUser (%s)', user);
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
    return this._db.insertDocument(data);
  },

  async getUser(user) {
    debug('getUser (%s)', user);
    await this.open();
    return getUser(this._db, user);
  },

  getUserInfo(user) {
    debug('getUserInfo (%s)', user);
    return this._getUserInfo(user);
  },

  async getUserGroups(user) {
    await this.open();
    let groups = await this._db.queryView('groupByUser', {
      key: user,
    });
    groups = groups.map((doc) => doc.value);
    const groupNameSet = new Set(groups.map((g) => g.name));
    // Add default groups
    let defaultGroupNames = await validate.getDefaultGroups(
      this._db,
      user,
      true,
    );
    const defaultGroups = [];
    for (let groupName of defaultGroupNames) {
      if (!groupNameSet.has(groupName)) {
        let group = await nanoMethods.getGroup(this._db, groupName);
        defaultGroups.push({
          name: groupName,
          rights: group ? group.rights : [],
        });
      }
    }
    return groups.concat(defaultGroups);
  },
};

async function getUser(db, user) {
  const rows = await db.queryView('user', {
    key: user,
    include_docs: true,
  });
  if (!rows.length) throw new CouchError('user not found', 'not found');
  if (rows.length > 1) {
    throw new CouchError(
      'unexepected: more than 1 user profile',
      'unreachable',
    );
  }
  return rows[0].doc;
}

module.exports = {
  methods,
};
