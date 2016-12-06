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

export function addValueToGroup(group, type, value) {
    global.test(group, type, value);
}

export function removeValueFromGroup(group, type, value) {
    global.test(group, type, value);
}

export const CREATE_GROUP = 'CREATE_GROUP';
export function createGroup(groupName) {
    const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
    return {
        type: CREATE_GROUP,
        payload: apiFetchJSON(groupUrl, {method: 'PUT'})
            .then(() => apiFetchJSON(groupUrl))
    };
}
