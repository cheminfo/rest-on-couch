'use strict';

const isEmail = require('../util/isEmail');

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

module.exports = {
    isSpecialUser,
    isValidGroupName,
    isValidUsername,
    isValidGlobalRightUser
};
