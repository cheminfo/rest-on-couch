import {GET_DB_LIST} from '../actions/db';

const initialState = {
    dbList: []
};

const dbReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${GET_DB_LIST}_FULFILLED`:
            return Object.assign({}, state, {dbList: action.payload});
        default:
            return state;
    }
};

export default dbReducer;
