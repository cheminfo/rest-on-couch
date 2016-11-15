'use strict';

const includes = require('array-includes');

const isEmail = require('../util/isEmail');
const constants = require('../constants');

function isSpecialUser(user) {
    return user === 'anonymous' || user === 'anyuser';
}

const validName = /^[a-zA-Z_-]+$/;

function isValidGroupName(groupName) {
    return validName.test(groupName) && !isSpecialUser(groupName) && !isEmail(groupName);
}

function isValidUsername(username) {
    return isEmail(username);
}

function isValidOwner(owner) {
    return isValidUsername(owner) || isValidGroupName(owner);
}

function isValidGlobalRightUser(user) {
    return isSpecialUser(user) || isValidUsername(user);
}

function isValidGlobalRightType(type) {
    return includes(constants.globalRightTypes, type);
}

function isAllowedFirstLevelKey(key) {
    return includes(constants.allowedFirstLevelKeys, key);
}

function isManagedDocumentType(type) {
    return type === 'entry' || type === 'group';
}

module.exports = {
    isSpecialUser,
    isValidGroupName,
    isValidUsername,
    isValidOwner,
    isValidGlobalRightUser,
    isValidGlobalRightType,
    isAllowedFirstLevelKey,
    isManagedDocumentType
};
