'use strict';

const Couch = require('../..');
const nanoPromise = require('../../src/util/nanoPromise');

function destroy(nano, name) {
    return nanoPromise.destroyDatabase(nano, name);
}

function populate(db) {
    const prom = [];

    prom.push(nanoPromise.insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com', 'groupA', 'groupB'],
        $id: 'A',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    return Promise.all(prom);
}

module.exports = function () {
    global.couch = new Couch({database: 'test'});
    return global.couch._init()
        .then(() => destroy(global.couch._nano, global.couch._databaseName))
        .then(() => {
            global.couch = new Couch({
                database: 'test',
                rights: {
                    read: ['anyuser']
                }
            });
            return global.couch._init();
        })
        .then(() => populate(global.couch._db));
};
