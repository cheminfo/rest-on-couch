import {HAS_LOGGED} from '../actions/login';

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
