import {createAction} from 'redux-actions';

import {apiFetchJSON} from '../api';
import {dbManager} from '../store';

export const GET_DB_LIST = 'GET_DB_LIST';
export function getDbList(dispatch) {
    dispatch({
        type: GET_DB_LIST,
        payload: apiFetchJSON('db/_all_dbs')
    });
}

export const SET_DB_NAME = 'SET_DB_NAME';
export const setDbName = createAction(SET_DB_NAME);

export const SET_USER_RIGHTS = 'SET_USER_RIGHTS';
export const setUserRights = createAction(SET_USER_RIGHTS);

export const SET_USER_GROUPS = 'SET_USER_GROUPS';
export const setUserGroups = createAction(SET_USER_GROUPS);

export const SET_DEFAULT_GROUPS = 'SET_DEFAULT_GROUPS';
export const setDefaultGroups = createAction(SET_DEFAULT_GROUPS);

export const SET_GLOBAL_RIGHTS = 'SET_GLOBAL_RIGHTS';
export const setGlobalRights = createAction(SET_GLOBAL_RIGHTS);

export const SET_MEMBERSHIPS = 'SET_MEMBERSHIPS';
export const setMemberships = createAction(SET_MEMBERSHIPS);

export const UPDATE_GROUP = 'UPDATE_GROUP';
const updateGroupAction = createAction(UPDATE_GROUP);

export function addValueToGroup(groupName, type, value) {
    return updateGroup(groupName, type, value, 'PUT');
}

export function removeValueFromGroup(groupName, type, value) {
    return updateGroup(groupName, type, value, 'DELETE');
}

function updateGroup(groupName, type, value, method) {
    if (method !== 'DELETE' && method !== 'PUT') {
        throw new Error('wrong method');
    }
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
    let url;
    if (type === 'owners') {
        url = `${groupUrl}/_owner/${value}`;
    } else if (type === 'users') {
        url = `${groupUrl}/user/${value}`;
    } else if (type === 'rights') {
        url = `${groupUrl}/right/${value}`;
    } else {
        throw new Error('unreachable');
    }
    return updateGroupAction(apiFetchJSON(url, {method}).then(() => apiFetchJSON(groupUrl)));
}

export const CREATE_GROUP = 'CREATE_GROUP';
export function createGroup(groupName, type) {
    type = type || 'default';
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}?type=${type}`;
    return {
        type: CREATE_GROUP,
        payload: apiFetchJSON(groupUrl, {method: 'PUT'})
            .then(() => apiFetchJSON(groupUrl))
    };
}


export const REMOVE_GROUP = 'REMOVE_GROUP';
export function removeGroup(groupName) {
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
    return {
        type: REMOVE_GROUP,
        meta: groupName,
        payload: apiFetchJSON(groupUrl, {method: 'DELETE'})
    };
}

export function setLdapGroupProperties(groupName, properties) {
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
    const setPropUrl = `${groupUrl}/ldap/properties`;
    return {
        type: UPDATE_GROUP,
        meta: groupName,
        payload: apiFetchJSON(setPropUrl, {method: 'PUT', body: JSON.stringify(properties)}).then(() => apiFetchJSON(groupUrl))
    };
}

export function syncLdapGroup(groupName) {
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
    const syncUrl = `${groupUrl}/ldap/sync`;
    return {
        type: UPDATE_GROUP,
        meta: groupName,
        payload: apiFetchJSON(syncUrl).then(() => apiFetchJSON(groupUrl))
    };
}

export function addDefaultGroup(user, group) {
    return editDefaultGroup(user, group, 'add');
}

export function removeDefaultGroup(user, group) {
    return editDefaultGroup(user, group, 'remove');
}

function editDefaultGroup(user, group, action) {
    const defaultGroupsUrl = `db/${dbManager.currentDb}/rights/defaultGroups`;
    const url = `${defaultGroupsUrl}/${user}/${group}`;
    return async function (dispatch) {
        if (action === 'add') {
            await apiFetchJSON(url, {method: 'PUT'});
        } else if (action === 'remove') {
            await apiFetchJSON(url, {method: 'DELETE'});
        }
        const defaultGroups = await apiFetchJSON(defaultGroupsUrl);
        dispatch(setDefaultGroups(defaultGroups));
    };
}

export function addGlobalRight(right, user) {
    return editGlobalRight(right, user, 'add');
}

export function removeGlobalRight(right, user) {
    return editGlobalRight(right, user, 'remove');
}

function editGlobalRight(right, user, action) {
    const globalRightsUrl = `db/${dbManager.currentDb}/rights/doc`;
    const url = `${globalRightsUrl}/${right}/${user}`;
    return async function (dispatch) {
        if (action === 'add') {
            await apiFetchJSON(url, {method: 'PUT'});
        } else if (action === 'remove') {
            await apiFetchJSON(url, {method: 'DELETE'});
        }

        const globalRights = await apiFetchJSON(globalRightsUrl);
        dispatch(setGlobalRights(globalRights));
    };

}

