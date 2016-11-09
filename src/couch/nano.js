'use strict';

const debug = require('../util/debug')('main:nano');
const nanoPromise = require('../util/nanoPromise');

async function getGroup(db, name) {
    debug.trace('get group');
    const groups = await nanoPromise.queryView(db, 'groupByName', {key: name, reduce: false, include_docs: true});
    if (!groups || groups.length === 0) {
        debug.trace('group does not exist');
        return null;
    }
    if (groups.length > 1) {
        debug.warn('Getting more than one result for a group name');
    }
    debug.trace('group exists');
    return groups[0].doc;
}

async function saveEntry(db, entry, user) {
    if (entry.$id === undefined) {
        entry.$id = null;
    }
    if (entry.$kind === undefined) {
        entry.$kind = null;
    }
    const now = Date.now();
    entry.$lastModification = user;
    entry.$modificationDate = now;
    if (entry.$creationDate === undefined) {
        entry.$creationDate = now;
    }

    const result = await nanoPromise.insertDocument(db, entry);
    result.$modificationDate = entry.$modificationDate;
    result.$creationDate = entry.$creationDate;
    return result;
}

module.exports = {
    getGroup,
    saveEntry
};
