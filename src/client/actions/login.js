import {apiFetchJSON, apiFetchForm, apiFetchFormJSON} from '../api';
import {dbManager} from '../store';

export const CHECK_LOGIN = 'CHECK_LOGIN';
export function checkLogin(dispatch, provider) {
    dispatch({
        type: CHECK_LOGIN,
        payload: checkTheLogin(provider)
    });
}

export function checkTheLogin(provider) {
    return apiFetchJSON('auth/session').then(session => {
        if (!session.provider) session.provider = provider;
        return session;
    });
}

export const LOGOUT = 'LOGOUT';
export function logout() {
    const logoutRequest = doLogout();
    logoutRequest.then(() => dbManager.syncDb());
    return {
        type: LOGOUT,
        payload: logoutRequest
    };
}

async function doLogout() {
    await apiFetchJSON('auth/logout');
}

export function loginLDAP(dispatch) {
    return (username, password) => {
        const loginRequest = doLDAPLogin(username, password);
        loginRequest.then(() => dbManager.syncDb());
        dispatch({
            type: CHECK_LOGIN,
            payload: loginRequest
        });
    };
}

export function loginCouchDB(dispatch) {
    return (username, password) => {
        const loginRequest = doCouchDBLogin(username, password);
        loginRequest.then(() => dbManager.syncDb());
        dispatch({
            type: CHECK_LOGIN,
            payload: loginRequest
        });
    };
}

async function doCouchDBLogin(username, password) {
    await apiFetchForm('auth/login/couchdb', {username, password});
    return checkTheLogin('couchdb');
}

async function doLDAPLogin(username, password) {
    await apiFetchForm('auth/login/ldap', {username, password});
    return checkTheLogin('ldap');
}

export const GET_LOGIN_PROVIDERS = 'GET_LOGIN_PROVIDERS';
export function getLoginProviders(dispatch) {
    dispatch({
        type: GET_LOGIN_PROVIDERS,
        payload: apiFetchJSON('auth/providers')
    });
}

export const CHANGE_COUCHDB_PASSWORD = 'CHANGE_COUCHDB_PASSWORD';
export function changeCouchDBPassword(oldPassword, newPassword) {
    return {
        type: CHANGE_COUCHDB_PASSWORD,
        payload: apiFetchFormJSON('auth/password', {oldPassword, newPassword})
    };
}

export const CREATE_COUCHDB_USER = 'CREATE_COUCHDB_USER';
export function createCouchDBUser(email, password) {
    return {
        type: CREATE_COUCHDB_USER,
        payload: apiFetchFormJSON('auth/couchdb/user', {email, password})
    };
}
