'use strict';

const debug = require('debug')('main:find');

const validateMethods = require('./validate');

const methods = {
  async findEntriesByRight(user, right, options) {
    debug('findEntriesByRight (%s, %s)', user, right);
    await this.open();
    options = options || {};
    const query = options.query || {};

    right = right || 'read';

    user = validateMethods.userFromTokenAndRights(user, options.token, [right]);

    // First check if user has global right
    const hasGlobalRight = await validateMethods.checkGlobalRight(
      this,
      user,
      right,
    );

    query.selector = query.selector || {};
    query.selector['\\$type'] = 'entry';
    if (hasGlobalRight) {
      query.selector['\\$owners'] = undefined;
    } else {
      const userGroups = await this.getGroupsByRight(user, right);
      userGroups.push(user);
      query.selector['\\$owners'] = {
        $in: userGroups,
      };
    }

    return this._db.queryMango(query);
  },
};

module.exports = { methods };
