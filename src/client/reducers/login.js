import {HAS_LOGGED, hasLogged} from '../actions/login';

const initialState = {
    loggedIn: false,
    username: null
};

const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case HAS_LOGGED:
            return Object.assign({}, state, {loggedIn: true, username: action.payload});
        default:
            return state;
    }
};

export default loginReducer;

export async function checkLogin(store) {
    const req = await fetch('/auth/session');
    const data = await req.json();
    if (data.authenticated) {
        store.dispatch(hasLogged(data.username));
    }
}
