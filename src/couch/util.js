'use strict';

const constants = require('../constants');
const CouchError = require('../util/CouchError');
const ensureStringArray = require('../util/ensureStringArray');
const isEmail = require('../util/isEmail');

function isSpecialUser(user) {
  return user === 'anonymous' || user === 'anyuser';
}

const validName = /^[0-9a-zA-Z._-]+$/; // do not forget to update the same regex in design/validateDocUpdate

function isValidGroupName(groupName) {
  return (
    validName.test(groupName) &&
    !isSpecialUser(groupName) &&
    !isEmail(groupName)
  );
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
  return constants.globalRightTypes.includes(type);
}

function isAllowedFirstLevelKey(key) {
  return constants.allowedFirstLevelKeys.includes(key);
}

function isManagedDocumentType(type) {
  return type === 'entry' || type === 'group';
}

function ensureOwnersArray(owners) {
  owners = ensureStringArray(owners);
  for (const owner of owners) {
    if (!isValidOwner(owner)) {
      throw new CouchError(`invalid owner: ${owner}`, 'invalid');
    }
  }
  return owners;
}

function ensureUsersArray(users) {
  users = ensureStringArray(users);
  for (const user of users) {
    if (!isValidUsername(user)) {
      throw new CouchError(`invalid user: ${user}`, 'invalid');
    }
  }
  return users;
}

function ensureRightsArray(rights) {
  rights = ensureStringArray(rights);
  for (const right of rights) {
    if (!isValidGlobalRightType(right)) {
      throw new CouchError(`invalid right: ${right}`, 'invalid');
    }
  }
  return rights;
}

function isLdapGroup(group) {
  return !!(group.DN && group.filter);
}

module.exports = {
  isSpecialUser,
  isValidGroupName,
  isValidUsername,
  isValidOwner,
  isValidGlobalRightUser,
  isValidGlobalRightType,
  isAllowedFirstLevelKey,
  isManagedDocumentType,
  isLdapGroup,
  ensureOwnersArray,
  ensureUsersArray,
  ensureRightsArray,
};
