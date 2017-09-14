'use strict';
const nanoPromise = require('../../src/util/nanoPromise');

module.exports = {
    resetDatabase(nano, name, username) {
        return nanoPromise.destroyDatabase(nano, name)
            .then(() => nanoPromise.createDatabase(nano, name))
            .then(() => nanoPromise.request(nano, {
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
            }));
    }
};


