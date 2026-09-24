import { ROC_ONLINE } from '../actions/main';

const initialState = {
  rocOnline: null,
};

export default function mainReducer(state = initialState, action = {}) {
  switch (action.type) {
    case ROC_ONLINE:
      return { ...state, rocOnline: action.payload };
    default:
      return state;
  }
};
