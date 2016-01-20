'use strict';

const Couch = require('../..');
const nanoPromise = require('../../src/util/nanoPromise');
const insertDocument = require('./insertDocument');

function destroy(nano, name) {
    return nanoPromise.destroyDatabase(nano, name);
}

function populate(db) {
    const prom = [];

    // Add groups
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
        users: ['a@a.com'],
        rights: ['create']
    }));

    prom.push(insertDocument(db, {
        $type: 'group',
        $owners: ['a@a.com'],
        name: 'anonymousRead',
        users: ['anonymous'],
        rights: ['read']
    }));

    // Add entries
    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com', 'groupA', 'groupB'],
        $id: 'A',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['a@a.com'],
        $id: 'B',
        _id: 'B',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com'],
        $id: 'C',
        _id: 'C',
        $creationDate: 0,
        $modificationDate: 0,
        $content: {}
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['b@b.com', 'groupC'],
        $id: 'anonymousEntry',
        $creationDate: 0,
        $modificationDate: 0
    }));

    prom.push(insertDocument(db, {
        $type: 'entry',
        $owners: ['c@c.com'],
        $id: 'entryWithAttachment',
        $creationDate: 0,
        $modificationDate: 0,
        _attachments: {
            'test.txt': {
                'content_type': 'text\/plain',
                'data': 'VEhJUyBJUyBBIFRFU1Q='
            }
        }
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
                    read: ['anonymous'],
                    createGroup: ['anonymous'],
                    create: ['anonymous']
                }
            });
            return global.couch._init();
        })
        .then(() => populate(global.couch._db));
};
