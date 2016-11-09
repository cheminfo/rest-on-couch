'use strict';

const includes = require('array-includes');

const isEmail = require('../util/isEmail');
const globalRightTypes = require('../constants').globalRightTypes;

function isSpecialUser(user) {
    return user === 'anonymous' || user === 'anyuser';
}

function isValidGroupName(groupName) {
    return !isSpecialUser(groupName) && !isEmail(groupName);
}

function isValidUsername(username) {
    return isEmail(username);
}

function isValidGlobalRightUser(user) {
    return isSpecialUser(user) || isValidUsername(user);
}

function isValidGlobalRightType(type) {
    return includes(globalRightTypes, type);
}

module.exports = {
    isSpecialUser,
    isValidGroupName,
    isValidUsername,
    isValidGlobalRightUser,
    isValidGlobalRightType
};
