import { ROC_ONLINE } from '../actions/main';

const initialState = {
  rocOnline: null,
};

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case ROC_ONLINE:
      return { ...state, rocOnline: action.payload };
    default:
      return state;
  }
};
