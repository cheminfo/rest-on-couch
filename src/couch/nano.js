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

module.exports = {
    getGroup
};
