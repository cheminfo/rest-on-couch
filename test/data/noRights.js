'use strict';

const Couch = require('../..');
const nanoPromise = require('../../lib/util/nanoPromise');
const insertDocument = require('./insertDocument');

function resetDatabase(nano, name, username) {
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

function populate(db) {
    const prom = [];
    prom.push(insertDocument(db, {
        _id: 'defaultGroups',
        $type: 'db',
        anonymous: ['defaultAnonymousRead'],
        anyuser: ['defaultAnyuserRead']
    }));

    prom.push(insertDocument(db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'groupA',
        users: ['a@a.com'],
        rights: ['create', 'write', 'delete', 'read']
    }));

    prom.push(insertDocument(db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'groupB',
        users: ['b@b.com', 'c@c.com'],
        rights: ['create']
    }));

    prom.push(insertDocument(db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'defaultAnonymousRead',
        users: [],
        rights: ['read']
    }));

    prom.push(insertDocument(db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'defaultAnyuserRead',
        users: [],
        rights: ['read']
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com', 'groupA', 'groupB'],
        $id: 'A',
        _id: 'A',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com'],
        $id: 'B',
        _id: 'B',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['a@a.com'],
        $id: 'onlyA',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['x@x.com', 'defaultAnonymousRead'],
        $id: 'entryWithDefaultAnonymousRead',
        $creationDate: 0,
        $modificationDate: 0
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['x@x.com', 'defaultAnyuserRead'],
        $id: 'entryWithDefaultAnyuserRead',
        $creationDate: 0,
        $modificationDate: 0
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['x@x.com', 'defaultAnonymousRead', 'defaultAnyuserRead'],
        $id: 'entryWithDefaultMultiRead',
        $creationDate: 0,
        $modificationDate: 0
    }));

    prom.push(insertDocument(db, {
        $type: 'token',
        $kind: 'entry',
        $owner: 'x@x.com',
        $id: 'mytoken',
        $creationDate: 0,
        uuid: 'A',
        rights: ['read']
    }));

    return Promise.all(prom);
}

module.exports = function () {
    global.couch = new Couch({database: 'test'});
    return global.couch.open()
        .then(() => resetDatabase(global.couch._nano, global.couch._databaseName, global.couch._couchOptions.username))
        .then(() => populate(global.couch._db))
        .then(() => {
            global.couch = new Couch({
                database: 'test',
                rights: {}
            });
            return global.couch.open();
        });
};
