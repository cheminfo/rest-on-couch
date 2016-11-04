import {HAS_LOGGED, LOGIN, LOGOUT} from '../actions/login';

const initialState = {
    loggedIn: false,
    username: null
};

const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case HAS_LOGGED:
        case `${LOGIN}_FULFILLED`:
            return Object.assign({}, state, onLogin(action.payload));
        case `${LOGOUT}_FULFILLED`:
            return Object.assign({}, state, {error: false, loggedIn: false, username: null});
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
