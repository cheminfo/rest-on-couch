'use strict';

const includes = require('array-includes');

const constants = require('../constants');
const debug = require('../util/debug')('main:validate');
const nanoPromise = require('../util/nanoPromise');
const getGroup = require('./nano').getGroup;

function validateRights(db, ownerArrays, user, rights) {
    debug.trace('validateRights');
    if (!Array.isArray(ownerArrays[0])) {
        ownerArrays = [ownerArrays];
    }

    let areOwners = ownerArrays.map(owner => isOwner(owner, user));

    if (areOwners.every(value => value === true)) {
        return Promise.resolve(areOwners);
    }

    if (typeof rights === 'string') {
        rights = [rights];
    }
    if (!Array.isArray(rights)) {
        throw new TypeError('rights must be an array or a string');
    }

    var checks = [];
    for (let i = 0; i < rights.length; i++) {
        checks.push(checkGlobalRight(db, user, rights[i])
            .then(function (hasGlobal) {
                if (hasGlobal) return ownerArrays.map(() => true);
                return Promise.all([getDefaultGroups(db, user), nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, rights[i]]}, {onlyValue: true})])
                    .then(result => {
                        const defaultGroups = result[0];
                        const groups = result[1];
                        return ownerArrays.map((owners, idx) => {
                            if (areOwners[idx]) return true;
                            for (let j = 0; j < owners.length; j++) {
                                if (includes(groups, owners[j])) return true;
                                for (let k = 0; k < defaultGroups.length; k++) {
                                    if (includes(owners, defaultGroups[k].name) && includes(defaultGroups[k].rights, rights[i])) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                    });
            }));
    }

    // Promise resolves with for each right an array of true/false that indicates if the user
    // has this right for the given owner array
    // For example
    //           read                        write
    //    own1[] own2[]  own3[]     own1[]   own2[]  own3[]
    // [ [true,  true,   false],   [false,   true,   false] ]

    return Promise.all(checks).then(result => {
        if (result.length === 0) {
            return areOwners;
        }
        return result[0].map((value, idx) => {
            for (let i = 0; i < result.length; i++) {
                if (result[i][idx] === true) {
                    return true;
                }
            }
            return false;
        });
    });

    //return Promise.all(checks).then(result => result.some(value => value === true));
}

async function validateTokenOrRights(db, uuid, owners, rights, user, token) {
    if (!Array.isArray(rights)) {
        rights = [rights];
    }
    if (token && token.$kind === 'entry' && token.uuid === uuid) {
        for (var i = 0; i < rights.length; i++) {
            if (includes(token.rights, rights[i])) {
                return true;
            }
        }
    }
    const ok = await validateRights(db, owners, user, rights);
    return ok[0];
}

function isOwner(owners, user) {
    for (var i = 0; i < owners.length; i++) {
        if (owners[i] === user) {
            return true;
        }
    }
    return false;
}

async function checkGlobalRight(db, user, right) {
    debug.trace(`checkGlobalRight (${user}, ${right})`);
    const result = await nanoPromise.queryView(db, 'globalRight', {key: right}, {onlyValue: true});
    for (var i = 0; i < result.length; i++) {
        if (result[i] === 'anonymous' || result[i] === user || result[i] === 'anyuser' && user !== 'anonymous') {
            debug.trace(`user ${user} has global right`);
            return true;
        }
    }
    debug.trace(`user ${user} does not have global right`);
    return false;
}

async function checkRightAnyGroup(db, user, right) {
    debug.trace(`checkRightAnyGroup (${user}, ${right}`);
    const hasGlobal = await checkGlobalRight(db, user, right);
    if (hasGlobal) return true;

    const defaultGroups = await getDefaultGroups(db, user);
    for (let i = 0; i < defaultGroups.length; i++) {
        if (includes(defaultGroups[i].rights, right)) {
            return true;
        }
    }

    const result = await nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, right]});
    return result.length > 0;
}

async function getDefaultGroups(db, user, listOnly) {
    debug.trace('getDefaultGroups');
    const defaultGroups = await nanoPromise.getDocument(db, constants.DEFAULT_GROUPS_DOC_ID);
    const toGet = new Set();
    for (let i = 0; i < defaultGroups.anonymous.length; i++) {
        toGet.add(defaultGroups.anonymous[i]);
    }
    if (user !== 'anonymous') {
        for (let i = 0; i < defaultGroups.anyuser.length; i++) {
            toGet.add(defaultGroups.anyuser[i]);
        }
    }

    if (listOnly) {
        return Array.from(toGet);
    } else {
        return Promise.all(Array.from(toGet).map(group => getGroup(db, group)));
    }
}

module.exports = {
    validateRights,
    validateTokenOrRights,
    isOwner,
    checkGlobalRight,
    checkRightAnyGroup,
    getDefaultGroups
};
