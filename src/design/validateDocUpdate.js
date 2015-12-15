'use strict';

module.exports = function (newDoc, oldDoc) {
    if (newDoc.$type === 'entry') {
        if (!oldDoc && !newDoc.$creationDate) {
            throw({forbidden: 'Creation date is mandatory'});
        }
        if (oldDoc && newDoc.$creationDate !== oldDoc.$creationDate) {
            throw({forbidden: 'Cannot change creation date'});
        }
    }
};
