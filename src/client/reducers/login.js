import {CHECK_LOGIN, LOGOUT, GET_LOGIN_PROVIDERS} from '../actions/login';

const initialState = {
    loginProviders: [],
    username: null,
    errors: {}
};

const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${CHECK_LOGIN}_FULFILLED`: {
            return Object.assign({}, state, onLogin(action.payload));
        }
        case `${LOGOUT}_FULFILLED`:
            return Object.assign({}, state, {errors: {}, username: null, provider: null});
        case `${GET_LOGIN_PROVIDERS}_FULFILLED`:
            return Object.assign({}, state, {loginProviders: action.payload});
        default:
            return state;
    }
};

export default loginReducer;

function onLogin(result) {
    if (!result.authenticated) {
        return {errors: {[result.provider]: true}};
    } else {
        return {errors: {}, username: result.username, provider: result.provider};
    }
}
