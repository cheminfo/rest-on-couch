'use strict';

module.exports = function (newDoc, oldDoc) {
    if (oldDoc) {
        if (newDoc.$creationDate !== oldDoc.$creationDate) {
            throw({forbidden: 'Cannot change creation date'})
        }
    } else {
        newDoc.$creationDate = Date.now();
    }

    newDoc.$modificationDate = Date.now();
};