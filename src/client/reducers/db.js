import {GET_DB_LIST, SET_DB_NAME} from '../actions/db';

const initialState = {
    dbName: null,
    dbList: []
};

const dbReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${GET_DB_LIST}_FULFILLED`:
            return Object.assign({}, state, {dbList: action.payload});
        case SET_DB_NAME:
            return Object.assign({}, state, {dbName: action.payload});
        default:
            return state;
    }
};

export default dbReducer;
