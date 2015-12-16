'use strict';

const nanoPromise = require('../../src/util/nanoPromise');

module.exports.destroy = function(nano, name) {
    return nanoPromise.destroyDatabase(nano, name);
};

module.exports.populate = function(db) {
    const prom = [];
    prom.push(nanoPromise.insertDocument(db, {
        '$type': 'group',
        name: 'groupA',
        'users': ['a@a.com'],
        rights: ['create', 'write', 'delete', 'read']
    }));

    prom.push(nanoPromise.insertDocument(db, {
        '$type': 'entry',
        '$owners': ['b@b.com', 'groupA'],
        '$id': 'A',
        '$creationDate': 0,
        '$modificationDate': 0
    }));

    return Promise.all(prom);
};