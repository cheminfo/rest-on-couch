import { SET_DB_NAME } from '../actions/database.js';

export default function databaseNameReducer(state = '', action = {}) {
  if (action.type === SET_DB_NAME) {
    return action.payload;
  }
  return state;
}
