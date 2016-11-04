import {createAction} from 'redux-actions';

import {apiFetchJSON, apiFetchForm} from '../api';

export const HAS_LOGGED = 'HAS_LOGGED';
export const hasLogged = createAction(HAS_LOGGED);

export async function checkLogin(store) {
    const data = await doCheckLogin();
    if (data.authenticated) {
        store.dispatch(hasLogged(data.username));
    }
}

export function doCheckLogin() {
    return apiFetchJSON('auth/session');
}

export const LOGOUT = 'LOGOUT';
export function logout(dispatch) {
    return () => {
        return dispatch({
            type: LOGOUT,
            payload: doLogout()
        });
    };
}

async function doLogout() {
    await apiFetchJSON('auth/logout');
}

export const LOGIN = 'LOGIN';
export function login(dispatch) {
    return (username, password) => {
        return dispatch({
            type : LOGIN,
            payload: doLogin(username, password)
        });
    }
}

async function doLogin(username, password) {
    await apiFetchForm('auth/login/ldap', {username, password});
    const data = await doCheckLogin();
    if (data.authenticated) {
        return data.username;
    } else {
        return false;
    }
}
