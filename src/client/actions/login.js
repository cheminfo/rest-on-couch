import {createAction} from 'redux-actions';

import {apiFetchJSON} from '../api';

export const HAS_LOGGED = 'HAS_LOGGED';
export const hasLogged = createAction(HAS_LOGGED);

export const LOGOUT = 'LOGOUT';

export async function checkLogin(store) {
    const data = await apiFetchJSON('auth/session');
    if (data.authenticated) {
        store.dispatch(hasLogged(data.username));
    }
}

export function logout(dispatch) {
    return () => {
        console.log('dispatching');
        return dispatch({
            type: LOGOUT,
            payload: doLogout()
        });
    };
}

async function doLogout() {
    await apiFetchJSON('auth/logout');
}
