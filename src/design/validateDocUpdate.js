'use strict';

module.exports = function (newDoc, oldDoc) {
    if (newDoc.$type === 'entry') {
        if (typeof newDoc.$creationDate !== 'number' || typeof newDoc.$modificationDate !== 'number') {
            throw({forbidden: 'Creation and modification dates are mandatory'});
        }
        if (oldDoc && newDoc.$creationDate !== oldDoc.$creationDate) {
            throw({forbidden: 'Cannot change creation date'});
        }
        if (newDoc.$modificationDate < oldDoc.$modificationDate) {
            throw({forbidden: 'Modification date cannot change to the past'});
        }
        if (newDoc.$modificationDate < newDoc.$creationDate) {
            throw({forbidden: 'Modification date cannot be before creation date'});
        }
    }
};
