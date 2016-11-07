import {CHECK_LOGIN, LOGIN, LOGOUT, GET_LOGIN_PROVIDERS} from '../actions/login';

const initialState = {
    loginProviders: [],
    loggedIn: false,
    username: null,
    error: false
};

const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${CHECK_LOGIN}_FULFILLED`: {
            if (action.payload) {
                return Object.assign({}, state, onLogin(action.payload));
            } else { // checkLogin returned false but this is not an error
                return state;
            }
        }
        case `${LOGIN}_FULFILLED`:
            return Object.assign({}, state, onLogin(action.payload));
        case `${LOGOUT}_FULFILLED`:
            return Object.assign({}, state, {error: false, loggedIn: false, username: null});
        case `${GET_LOGIN_PROVIDERS}_FULFILLED`:
            return Object.assign({}, state, {loginProviders: action.payload});
        default:
            return state;
    }
};

export default loginReducer;

function onLogin(result) {
    if (!result) {
        return {error: true};
    } else {
        return {error: false, loggedIn: true, username: result};
    }
}
