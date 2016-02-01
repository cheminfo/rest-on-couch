'use strict';

module.exports = function (newDoc, oldDoc) {
    // allow to delete documents
    if (newDoc._deleted) {
        return;
    }
    var validTypes = ['entry', 'group', 'db', 'log'];
    var validRights = ['create', 'read', 'write', 'createGroup'];
    // see http://emailregex.com/
    var validEmail = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

    function validateOwners(doc) {
        if (!Array.isArray(doc.$owners)) {
            throw({forbidden: 'Missing owners array'});
        }
        if (!validEmail.test(doc.$owners[0])) {
            throw({forbidden: 'First owner must be an email'});
        }
    }

    if (!newDoc.$type || validTypes.indexOf(newDoc.$type) === -1) {
        throw({forbidden: 'Invalid type'});
    }
    if (oldDoc && newDoc.$type !== oldDoc.$type) {
        throw({forbidden: 'Cannot change the type of document'});
    }

    if (newDoc.$type === 'group') {
        if (!newDoc.name) {
            throw({forbidden: 'group must have a name'});
        }
        if (validEmail.test(newDoc.name)) {
            throw({forbidden: 'group name cannot be an email'});
        }
        validateOwners(newDoc);
    } else if (newDoc.$type === 'entry') {
        if (typeof newDoc.$creationDate !== 'number' || typeof newDoc.$modificationDate !== 'number') {
            throw({forbidden: 'Creation and modification dates are mandatory'});
        }
        if (newDoc.$modificationDate < newDoc.$creationDate) {
            throw({forbidden: 'Modification date cannot be before creation date'});
        }
        validateOwners(newDoc);
        var i;
        if (oldDoc) {
            if (newDoc.$creationDate !== oldDoc.$creationDate) {
                throw({forbidden: 'Cannot change creation date'});
            }
            if (newDoc.$modificationDate < oldDoc.$modificationDate) {
                throw({forbidden: 'Modification date cannot change to the past'});
            }
            if (Array.isArray(newDoc.$id) && Array.isArray(oldDoc.$id)) {
                if (newDoc.$id.length !== oldDoc.$id.length) {
                    throw({forbidden: 'Cannot change the ID'});
                }
                for (i=0; i<newDoc.$id.length; i++) {
                    if (newDoc.$id[i] !== oldDoc.$id[i]) {
                        throw({forbidden: 'Cannot change the ID'});
                    }
                }
            } else if (newDoc.$id !== oldDoc.$id) {
                throw({forbidden: 'Cannot change the ID'});
            }
            if (newDoc.$kind !== oldDoc.$kind) {
                throw({forbidden: 'Cannot change the kind'});
            }
        }
    } else if (newDoc.$type === 'log' && oldDoc) {
        throw({forbidden: 'Logs cannot be changed'});
    } else if (newDoc.$type === 'db') {
        for (i=0; i<validRights.length; i++) {
            if (newDoc[validRights[i]] !== undefined && !Array.isArray(newDoc[validRights[i]])) {
                throw({forbidden: 'global db right should always be an array'});
            }
        }
    }
};
