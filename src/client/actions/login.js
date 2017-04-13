import {apiFetchJSON, apiFetchForm} from '../api';
import {dbManager} from '../store';

export const CHECK_LOGIN = 'CHECK_LOGIN';
export function checkLogin(dispatch) {
    dispatch({
        type: CHECK_LOGIN,
        payload: checkTheLogin()
    });
}

async function checkTheLogin() {
    const data = await doCheckLogin();
    if (data.authenticated) {
        return data.username;
    }
    return false;
}

export function doCheckLogin() {
    return apiFetchJSON('auth/session');
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

export const LOGIN_LDAP = 'LOGIN_LDAP';
export function loginLDAP(dispatch) {
    return (username, password) => {
        const ldapLoginRequest = doLDAPLogin(username, password);
        ldapLoginRequest.then(() => dbManager.syncDb());
        dispatch({
            type: LOGIN_LDAP,
            payload: ldapLoginRequest
        });
    };
}

export const LOGIN_COUCHDB = 'LOGIN_COUCHDB';
export function loginCouchDB(dispatch) {
    return (username, password) => {
        const req = doCouchDBLogin(username, password);
        req.then(() => dbManager.syncDb());
        dispatch({
            type: LOGIN_COUCHDB,
            payload: req
        });
    };
}

async function doCouchDBLogin(username, password) {
    await apiFetchForm('auth/login/couchdb', {username, password});
    const data = await doCheckLogin();
    if (data.authenticated) {
        return data.username;
    } else {
        return false;
    }
}

async function doLDAPLogin(username, password) {
    await apiFetchForm('auth/login/ldap', {username, password});
    const data = await doCheckLogin();
    if (data.authenticated) {
        return data.username;
    } else {
        return false;
    }
}

export const GET_LOGIN_PROVIDERS = 'GET_LOGIN_PROVIDERS';
export function getLoginProviders(dispatch) {
    dispatch({
        type: GET_LOGIN_PROVIDERS,
        payload: apiFetchJSON('auth/providers')
    });
}
