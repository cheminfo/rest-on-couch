'use strict';
const nanoPromise = require('../../src/util/nanoPromise');

module.exports = {
  async resetDatabase(nano, name, username) {
    await nanoPromise.destroyDatabase(nano, name);
    // Workaround flaky tests: "The database could not be created, the file already exists."
    await wait(10);
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

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
