'use strict';

const includes = require('array-includes');

const constants = require('../constants');
const debug = require('../util/debug')('main:validate');
const nanoPromise = require('../util/nanoPromise');
const getGroup = require('./nano').getGroup;
const ensureStringArray = require('../util/ensureStringArray');

async function validateRights(ctx, ownerArrays, user, rights, type = 'entry') {
    debug.trace('validateRights');
    if (!Array.isArray(ownerArrays[0])) {
        ownerArrays = [ownerArrays];
    }

    if (ctx.isAdmin(user)) {
        return ownerArrays.map(() => true);
    }

    const db = ctx._db;

    let areOwners = ownerArrays.map(owner => isOwner(owner, user));

    if (areOwners.every(value => value === true)) {
        return areOwners;
    }

    rights = ensureStringArray(rights);
    if (type !== 'entry') {
        const suffix = type.charAt(0).toUpperCase() + type.substring(1);
        rights = rights.map(right => right + suffix);
    }

    const checks = [];
    for (let i = 0; i < rights.length; i++) {
        checks.push(doGlobalRightCheck(rights[i]));
    }

    async function doGlobalRightCheck(right) {
        const hasGlobal = await checkGlobalRight(ctx, user, right);
        if (hasGlobal) return ownerArrays.map(() => true);

        const [defaultGroups, groups] = await Promise.all([getDefaultGroups(db, user), nanoPromise.queryView(db, 'groupByUserAndRight', {key: [user, right]}, {onlyValue: true})]);
        return ownerArrays.map((owners, idx) => {
            if (areOwners[idx]) return true;
            for (let j = 0; j < owners.length; j++) {
                if (includes(groups, owners[j])) return true;
                for (let k = 0; k < defaultGroups.length; k++) {
                    if (includes(owners, defaultGroups[k].name) && includes(defaultGroups[k].rights, right)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    // Promise resolves with for each right an array of true/false that indicates if the user
    // has this right for the given owner array
    // For example
    //           read                        write
    //    own1[] own2[]  own3[]     own1[]   own2[]  own3[]
    // [ [true,  true,   false],   [false,   true,   false] ]

    const result = await Promise.all(checks);
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
}

async function validateTokenOrRights(ctx, uuid, owners, rights, user, token, type = 'entry') {
    rights = ensureStringArray(rights);

    if (token && token.$kind === type && token.uuid === uuid) {
        for (var i = 0; i < rights.length; i++) {
            if (includes(token.rights, rights[i])) {
                return true;
            }
        }
    }
    const ok = await validateRights(ctx, owners, user, rights, type);
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

async function checkGlobalRight(ctx, user, right) {
    debug.trace(`checkGlobalRight (${user}, ${right})`);
    if (ctx.isAdmin(user)) {
        return true;
    }

    const result = await nanoPromise.queryView(ctx._db, 'globalRight', {key: right}, {onlyValue: true});
    for (var i = 0; i < result.length; i++) {
        if (result[i] === 'anonymous' || result[i] === user || result[i] === 'anyuser' && user !== 'anonymous') {
            debug.trace(`user ${user} has global right`);
            return true;
        }
    }
    debug.trace(`user ${user} does not have global right`);
    return false;
}

async function checkRightAnyGroup(ctx, user, right) {
    debug.trace(`checkRightAnyGroup (${user}, ${right}`);
    const db = ctx._db;
    const hasGlobal = await checkGlobalRight(ctx, user, right);
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
