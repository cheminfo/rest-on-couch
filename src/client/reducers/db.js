import {GET_DB_LIST, SET_USER_GROUPS} from '../actions/db';

const initialState = {
    dbList: [],
    userGroups: []
};

const dbReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${GET_DB_LIST}_FULFILLED`:
            return Object.assign({}, state, {dbList: action.payload});
        case SET_USER_GROUPS:
            return Object.assign({}, state, {userGroups: action.payload});
        default:
            return state;
    }
};

export default dbReducer;
