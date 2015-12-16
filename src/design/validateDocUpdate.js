'use strict';

module.exports = function (newDoc, oldDoc) {
    var validTypes = ['entry', 'group', 'db'];
    if (!newDoc.$type || validTypes.indexOf(newDoc.$type) === -1) {
        throw({forbidden: 'Invalid type'});
    }
    if (oldDoc && newDoc.$type !== oldDoc.$type) {
        throw({forbidden: 'Cannot change the type of document'});
    }
    if (newDoc.$type === 'entry') {
        if (!newDoc.$id) {
            throw({forbidden: 'ID is mandatory'});
        }
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
            if (newDoc.$id !== oldDoc.$id) {
                throw({forbidden: 'Cannot change the ID'});
            }
        }
    }
};
