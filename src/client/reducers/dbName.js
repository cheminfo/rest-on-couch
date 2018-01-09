import { SET_DB_NAME } from '../actions/db';

const dbNameReducer = (state = null, action) => {
  if (action.type === SET_DB_NAME) {
    return action.payload;
  } else {
    return state;
  }
};

export default dbNameReducer;
