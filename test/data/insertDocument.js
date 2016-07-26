'use strict';

const nanoPromise = require('../../lib/util/nanoPromise');

module.exports = function (db, entry) {
    processEntry(entry);
    return nanoPromise.insertDocument(db, entry);
};

function processEntry(entry) {
    if (entry.$type === 'entry') {
        if (entry.$id === undefined) {
            entry.$id = null;
        }
        if (entry.$kind === undefined) {
            entry.$kind = null;
        }
    }
}
