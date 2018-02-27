'use strict';
const nanoPromise = require('../../src/util/nanoPromise');

module.exports = {
  async resetDatabase(nano, name, username) {
    await nanoPromise.destroyDatabase(nano, name);
    await nanoPromise.createDatabase(nano, name);
    await nanoPromise.request(nano, {
      method: 'PUT',
      db: name,
      doc: '_security',
      body: {
        admins: {
          names: [username],
          roles: []
        },
        members: {
          names: [username],
          roles: []
        }
      }
    });
  }
};
