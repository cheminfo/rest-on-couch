'use strict';

module.exports = function (newDoc, oldDoc) {
    if (newDoc.$type === 'entry') {
        // todo $id is mandatory
        if (typeof newDoc.$creationDate !== 'number' || typeof newDoc.$modificationDate !== 'number') {
            throw({forbidden: 'Creation and modification dates are mandatory'});
        }
        if (newDoc.$modificationDate < newDoc.$creationDate) {
            throw({forbidden: 'Modification date cannot be before creation date'});
        }
        if (oldDoc) {
            if (newDoc.$creationDate !== oldDoc.$creationDate) {
                throw({forbidden: 'Cannot change creation date'});
            }
            if (newDoc.$modificationDate < oldDoc.$modificationDate) {
                throw({forbidden: 'Modification date cannot change to the past'});
            }
        }
    }
};
