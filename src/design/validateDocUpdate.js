'use strict';

module.exports = function (newDoc, oldDoc, userCtx) {
    if (userCtx.name === null) {
        throw ({forbidden: 'must be connected'});
    }
    // allow to delete documents
    if (newDoc._deleted) {
        return;
    }
    var validTypes = ['entry', 'group', 'db', 'log', 'user', 'token'];
    var validRights = ['create', 'read', 'write', 'createGroup'];
    // see http://emailregex.com/
    var validEmail = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
    var validName = /^[0-9a-zA-Z_-]+$/;

    function validateOwners(doc) {
        if (!Array.isArray(doc.$owners)) {
            throw ({forbidden: 'Missing owners array'});
        }
        if (!validEmail.test(doc.$owners[0])) {
            throw ({forbidden: 'First owner must be an email'});
        }
        for (var i = 1; i < doc.$owners.length; i++) {
            if (!validEmail.test(doc.$owners[i]) && !validName.test(doc.$owners[i])) {
                throw ({forbidden: 'Owners must be valid emails or names'});
            }
        }
    }

    function validateName(name) {
        if (!validName.test(name)) {
            throw ({forbidden: 'Names can only be alphanumerical'});
        }
    }

    function validateNames(list) {
        if (!Array.isArray(list)) {
            throw ({forbidden: 'Names list must be an array'});
        }
        for (var i = 0; i < list.length; i++) {
            validateName(list[i]);
        }
    }

    function validateUser(user) {
        if (!validEmail.test(user)) {
            throw ({forbidden: 'Users can only be emails'});
        }
    }

    function validateUsers(list) {
        if (!Array.isArray(list)) {
            throw ({forbidden: 'Users list must be an array'});
        }
        for (var i = 0; i < list.length; i++) {
            validateUser(list[i]);
        }
    }

    function validateDates(newDoc, oldDoc) {
        if (typeof newDoc.$creationDate !== 'number' || typeof newDoc.$modificationDate !== 'number') {
            throw ({forbidden: 'Creation and modification dates are mandatory'});
        }
        if (newDoc.$modificationDate < newDoc.$creationDate) {
            throw ({forbidden: 'Modification date cannot be before creation date'});
        }
        if (oldDoc) {
            if (newDoc.$creationDate !== oldDoc.$creationDate) {
                throw ({forbidden: 'Cannot change creation date'});
            }
            if (newDoc.$modificationDate < oldDoc.$modificationDate) {
                throw ({forbidden: 'Modification date cannot change to the past'});
            }
        }
        if (typeof newDoc.$lastModification !== 'string') {
            throw ({forbidden: 'Missing last modification username'});
        }
        // TODO: validate owner
        //validateUser(newDoc.$lastModification);
    }

    if (!newDoc.$type || validTypes.indexOf(newDoc.$type) === -1) {
        throw ({forbidden: 'Invalid type: ' + newDoc.$type});
    }
    if (oldDoc && newDoc.$type !== oldDoc.$type) {
        throw ({forbidden: 'Cannot change the type of document'});
    }

    if (newDoc.$type === 'group') {
        if (!newDoc.name) {
            throw ({forbidden: 'group must have a name'});
        }
        validateName(newDoc.name);
        validateOwners(newDoc);
        validateUsers(newDoc.users);
        validateDates(newDoc, oldDoc);
    } else if (newDoc.$type === 'entry') {
        validateOwners(newDoc);
        validateDates(newDoc, oldDoc);
        var i;
        if (oldDoc) {
            if (Array.isArray(newDoc.$id) && Array.isArray(oldDoc.$id)) {
                if (newDoc.$id.length !== oldDoc.$id.length) {
                    throw ({forbidden: 'Cannot change the ID'});
                }
                for (i = 0; i < newDoc.$id.length; i++) {
                    if (newDoc.$id[i] !== oldDoc.$id[i]) {
                        throw ({forbidden: 'Cannot change the ID'});
                    }
                }
            } else if (newDoc.$id !== oldDoc.$id) {
                throw ({forbidden: 'Cannot change the ID'});
            }
            if (newDoc.$kind !== oldDoc.$kind) {
                throw ({forbidden: 'Cannot change the kind'});
            }
        }
    } else if (newDoc.$type === 'log' && oldDoc) {
        throw ({forbidden: 'Logs cannot be changed'});
    } else if (newDoc.$type === 'db') {
        if (newDoc._id === 'rights') {
            for (i = 0; i < validRights.length; i++) {
                if (newDoc[validRights[i]] !== undefined && !Array.isArray(newDoc[validRights[i]])) {
                    throw ({forbidden: 'global db right should always be an array'});
                }
            }
        } else if (newDoc._id === 'defaultGroups') {
            validateNames(newDoc.anonymous);
            validateNames(newDoc.anyuser);
        }
    } else if (newDoc.$type === 'user') {
        if (!newDoc.user || !validEmail.test(newDoc.user)) {
            throw ({forbidden: 'user must have user property, which must be an email'});
        }
    } else if (newDoc.$type === 'token') {
        if (oldDoc) {
            throw ({forbidden: 'Tokens are immutable'});
        }
        if (newDoc.$kind !== 'entry') {
            throw ({forbidden: 'Only entry tokens are supported'});
        }
        if (!newDoc.$id || !newDoc.$owner || !newDoc.uuid || (typeof newDoc.$creationDate !== 'number') || !Array.isArray(newDoc.rights)) {
            throw ({forbidden: 'token is missing fields'});
        }
    }
};
