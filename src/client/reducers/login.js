import {HAS_LOGGED, LOGIN, LOGOUT} from '../actions/login';

const initialState = {
    loggedIn: false,
    username: null
};

const loginReducer = (state = initialState, action) => {
    switch (action.type) {
        case HAS_LOGGED:
        case `${LOGIN}_FULFILLED`:
            return Object.assign({}, state, {loggedIn: true, username: action.payload});
        case `${LOGOUT}_FULFILLED`:
            return Object.assign({}, state, {loggedIn: false, username: null});
        default:
            return state;
    }
};

export default loginReducer;
