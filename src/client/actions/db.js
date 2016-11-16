import {createAction} from 'redux-actions';

import {apiFetchJSON} from '../api';

export const GET_DB_LIST = 'GET_DB_LIST';
export function getDbList(dispatch) {
    dispatch({
        type: GET_DB_LIST,
        payload: apiFetchJSON('db/_all_dbs')
    });
}

export const SET_DB_NAME = 'SET_DB_NAME';
export const setDbName = createAction(SET_DB_NAME);

export const SET_USER_GROUPS = 'SET_USER_GROUPS';
export const setUserGroups = createAction(SET_USER_GROUPS);
