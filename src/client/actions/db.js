import { createAction } from 'redux-actions';

import { apiFetchJSON } from '../api';
import { dbManager } from '../store';

export const GET_DB_LIST = 'GET_DB_LIST';
export function getDbList(dispatch) {
  dispatch({
    type: GET_DB_LIST,
    payload: apiFetchJSON('db/_all_dbs'),
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

export const CLEAR_GROUP_SUCCESS = 'CLEAR_GROUP_SUCCESS';

export const CLEAR_GROUP_ERROR = 'CLEAR_GROUP_ERROR';

export function clearGroupSuccess(groupName) {
  return {
    type: CLEAR_GROUP_SUCCESS,
    meta: { groupName },
  };
}

export function clearGroupError(groupName) {
  return {
    type: CLEAR_GROUP_ERROR,
    meta: { groupName },
  };
}

export function addValueToGroup(groupName, type, value, options) {
  return updateGroup(groupName, type, value, 'PUT', options);
}

export function removeValueFromGroup(groupName, type, value, options) {
  return updateGroup(groupName, type, value, 'DELETE', options);
}

function updateGroup(groupName, type, value, method, options) {
  return {
    type: UPDATE_GROUP,
    meta: Object.assign({}, options, { groupName }),
    payload: doUpdateGroup(groupName, type, value, method),
  };
}

async function doUpdateGroup(groupName, type, value, method) {
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

  const res = await apiFetchJSON(url, { method });
  if (!res.error) {
    return apiFetchJSON(groupUrl);
  }
  return res;
}

export const CREATE_GROUP = 'CREATE_GROUP';
export function createGroup(groupName, type) {
  type = type || 'default';
  const groupUrl = `db/${dbManager.currentDb}/group/${groupName}?type=${type}`;
  return {
    type: CREATE_GROUP,
    payload: doCreateGroup(groupUrl),
  };
}

async function doCreateGroup(groupUrl) {
  const res = await apiFetchJSON(groupUrl, { method: 'PUT' });
  if (res.error) {
    return res;
  }
  return apiFetchJSON(groupUrl);
}

export const REMOVE_GROUP = 'REMOVE_GROUP';
export function removeGroup(groupName) {
  const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
  return {
    type: REMOVE_GROUP,
    meta: { groupName },
    payload: apiFetchJSON(groupUrl, { method: 'DELETE' }),
  };
}

export function setGroupProperties(groupName, properties) {
  const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
  const setPropUrl = `${groupUrl}/properties`;
  return {
    type: UPDATE_GROUP,
    meta: { groupName },
    payload: doUpdateGroupProperties(groupUrl, setPropUrl, properties),
  };
}

export function setLdapGroupProperties(groupName, properties) {
  const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
  const setPropUrl = `${groupUrl}/ldap/properties`;
  return {
    type: UPDATE_GROUP,
    meta: { groupName },
    payload: doUpdateGroupProperties(groupUrl, setPropUrl, properties),
  };
}

async function doUpdateGroupProperties(groupUrl, setPropUrl, properties) {
  await apiFetchJSON(setPropUrl, {
    method: 'PUT',
    body: JSON.stringify(properties),
  });
  return apiFetchJSON(groupUrl);
}

export function syncLdapGroup(groupName) {
  return {
    type: UPDATE_GROUP,
    meta: { groupName },
    payload: doLdapSync(groupName),
  };
}

async function doLdapSync(groupName) {
  const groupUrl = `db/${dbManager.currentDb}/group/${groupName}`;
  const syncUrl = `${groupUrl}/ldap/sync`;
  let res = await apiFetchJSON(syncUrl);
  if (!res.error) {
    res = await apiFetchJSON(groupUrl);
  }
  return res;
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
  return async function editGroup(dispatch) {
    if (action === 'add') {
      await apiFetchJSON(url, { method: 'PUT' });
    } else if (action === 'remove') {
      await apiFetchJSON(url, { method: 'DELETE' });
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
  return async function editRight(dispatch) {
    if (action === 'add') {
      await apiFetchJSON(url, { method: 'PUT' });
    } else if (action === 'remove') {
      await apiFetchJSON(url, { method: 'DELETE' });
    }

    const globalRights = await apiFetchJSON(globalRightsUrl);
    dispatch(setGlobalRights(globalRights));
  };
}
