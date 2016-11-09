import {CHECK_LOGIN, LOGIN_LDAP, LOGOUT, GET_LOGIN_PROVIDERS} from '../actions/login';

const initialState = {
    loginProviders: [],
    loggedIn: false,
    username: null,
    errors: {}
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
        case `${LOGIN_LDAP}_FULFILLED`:
            return Object.assign({}, state, onLogin('ldap', action.payload));
        case `${LOGOUT}_FULFILLED`:
            return Object.assign({}, state, {errors: {}, loggedIn: false, username: null});
        case `${GET_LOGIN_PROVIDERS}_FULFILLED`:
            return Object.assign({}, state, {loginProviders: action.payload});
        default:
            return state;
    }
};

export default loginReducer;

function onLogin(type, result) {
    if (!result) {
        return {errors: {[type]: true}};
    } else {
        return {errors: {}, loggedIn: true, username: result};
    }
}
