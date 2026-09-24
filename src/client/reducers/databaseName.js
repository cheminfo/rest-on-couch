import { SET_DB_NAME } from '../actions/database.js';

export default (state = '', action = {}) => {
  if (action.type === SET_DB_NAME) {
    return action.payload;
  }
  return state;
};
